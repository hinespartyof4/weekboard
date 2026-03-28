"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  BarcodeFormat,
  BrowserCodeReader,
  BrowserMultiFormatReader,
  type IScannerControls,
} from "@zxing/browser";
import {
  ArrowLeft,
  CameraOff,
  LoaderCircle,
  RefreshCw,
  ScanLine,
  Search,
  ShieldAlert,
  Smartphone,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { lookupBarcodeAction, saveScannedItemAction } from "@/lib/barcode/actions";
import { storeBarcodeFeedback } from "@/lib/barcode/feedback";
import { mockBarcodeExamples } from "@/lib/barcode/mock";
import { normalizeBarcodeValue } from "@/lib/barcode/service";
import type {
  BarcodeConfirmationValues,
  BarcodeDestination,
  BarcodeLookupProduct,
} from "@/lib/barcode/types";
import type { StorageLocation } from "@/lib/pantry/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BarcodeConfirmationForm } from "@/components/barcode/barcode-confirmation-form";

type BarcodeScannerModalProps = {
  defaultDestination: BarcodeDestination;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ScanStage =
  | "scan"
  | "manual"
  | "lookup"
  | "confirm"
  | "permission_denied"
  | "camera_unavailable"
  | "error";

type CameraState = "idle" | "requesting" | "ready";

const supportedFormats = [
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.EAN_8,
  BarcodeFormat.EAN_13,
];

const storageLocationOptions: Array<{ value: StorageLocation; label: string }> = [
  { value: "pantry", label: "Pantry" },
  { value: "fridge", label: "Fridge" },
  { value: "freezer", label: "Freezer" },
  { value: "cleaning", label: "Cleaning" },
  { value: "bathroom", label: "Bathroom" },
  { value: "laundry", label: "Laundry" },
  { value: "other", label: "Other" },
];

const scannerStartTimeoutMs = 4500;

function getInitialValues(destination: BarcodeDestination): BarcodeConfirmationValues {
  return {
    destination,
    barcode: "",
    name: "",
    category: "",
    quantity: "1",
    unit: "",
    preferredStore: "",
    notes: "",
    storageLocation: "pantry",
    expirationDate: "",
  };
}

function getLookupMessage(product: BarcodeLookupProduct | null, mode: "mock" | "live" | null) {
  if (product) {
    if (mode === "mock") {
      return "Matched from Weekboard sample data. This is useful for local testing, but it is not a live catalog result.";
    }

    return "Matched from the live product catalog. Review the details once, then save it to the right place.";
  }

  if (mode === "mock") {
    return "No sample product match came back. You can still enter the item details below and keep going.";
  }

  return "No product match came back from the live catalog. You can still enter the item details below and keep going.";
}

function isPermissionError(error: unknown) {
  return error instanceof Error && ["NotAllowedError", "PermissionDeniedError"].includes(error.name);
}

function isCameraUnavailableError(error: unknown) {
  return error instanceof Error && error.name === "NotFoundError";
}

function stopMediaStream(stream: MediaStream | null) {
  if (!stream) {
    return;
  }

  for (const track of stream.getTracks()) {
    track.stop();
  }
}

function resetVideoElement(videoElement: HTMLVideoElement | null) {
  if (!videoElement) {
    return;
  }

  try {
    videoElement.pause();
  } catch {
    // Pause can throw while the element is tearing down on mobile Safari.
  }

  videoElement.srcObject = null;
  videoElement.removeAttribute("src");
  videoElement.load();
}

function getPreferredVideoInput(
  devices: MediaDeviceInfo[],
  currentDeviceId: string | null,
) {
  if (!devices.length) {
    return null;
  }

  const rearFacingKeywords = ["back", "rear", "environment", "wide", "ultra"];

  const bestRear = devices.find((device) =>
    rearFacingKeywords.some((keyword) => device.label.toLowerCase().includes(keyword)),
  );

  if (bestRear) {
    return bestRear;
  }

  return devices.find((device) => device.deviceId !== currentDeviceId) ?? devices[0];
}

async function waitForVideoPreview(videoElement: HTMLVideoElement) {
  videoElement.muted = true;
  videoElement.playsInline = true;
  videoElement.autoplay = true;
  videoElement.setAttribute("muted", "true");
  videoElement.setAttribute("playsinline", "true");
  videoElement.setAttribute("autoplay", "true");

  await new Promise<void>((resolve, reject) => {
    if (videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && videoElement.videoWidth > 0) {
      void videoElement
        .play()
        .then(() => resolve())
        .catch((error) => reject(error));
      return;
    }

    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("The camera opened, but the live preview did not start."));
    }, scannerStartTimeoutMs);

    function cleanup() {
      window.clearTimeout(timeoutId);
      videoElement.removeEventListener("loadedmetadata", handleReady);
      videoElement.removeEventListener("canplay", handleReady);
    }

    function handleReady() {
      void videoElement
        .play()
        .then(() => {
          cleanup();
          resolve();
        })
        .catch((error) => {
          cleanup();
          reject(error);
        });
    }

    videoElement.addEventListener("loadedmetadata", handleReady);
    videoElement.addEventListener("canplay", handleReady);
  });
}

async function requestScannerStream(deviceId?: string) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Camera access is not available in this browser.");
  }

  const baseConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30, max: 30 },
  } satisfies MediaTrackConstraints;

  const candidates: Array<MediaTrackConstraints | true> = deviceId
    ? [{ deviceId: { exact: deviceId }, ...baseConstraints }]
    : [
        { facingMode: { exact: "environment" }, ...baseConstraints },
        { facingMode: { ideal: "environment" }, ...baseConstraints },
        baseConstraints,
        true,
      ];

  let lastError: unknown = null;

  for (const video of candidates) {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: false,
        video,
      });
    } catch (error) {
      if (isPermissionError(error) || isCameraUnavailableError(error)) {
        throw error;
      }

      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("The scanner could not start on this device.");
}

async function prepareScannerStream() {
  const initialStream = await requestScannerStream();
  const currentDeviceId = initialStream.getVideoTracks()[0]?.getSettings().deviceId ?? null;

  try {
    const devices = await BrowserCodeReader.listVideoInputDevices();
    const preferredDevice = getPreferredVideoInput(devices, currentDeviceId);

    if (!preferredDevice?.deviceId || preferredDevice.deviceId === currentDeviceId) {
      return initialStream;
    }

    const preferredStream = await requestScannerStream(preferredDevice.deviceId);
    stopMediaStream(initialStream);
    return preferredStream;
  } catch {
    return initialStream;
  }
}

export function BarcodeScannerModal({
  defaultDestination,
  open,
  onOpenChange,
}: BarcodeScannerModalProps) {
  const pathname = usePathname();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const hasResolvedScanRef = useRef(false);
  const [stage, setStage] = useState<ScanStage>("scan");
  const [cameraState, setCameraState] = useState<CameraState>("requesting");
  const [manualBarcode, setManualBarcode] = useState("");
  const [lookupMode, setLookupMode] = useState<"mock" | "live" | null>(null);
  const [lookupProduct, setLookupProduct] = useState<BarcodeLookupProduct | null>(null);
  const [formValues, setFormValues] = useState<BarcodeConfirmationValues>(
    getInitialValues(defaultDestination),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLookupPending, startLookupTransition] = useTransition();
  const [isSavePending, startSaveTransition] = useTransition();

  const stopScanner = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    readerRef.current = null;
    hasResolvedScanRef.current = false;
    resetVideoElement(videoRef.current);
    setCameraState("idle");
  }, []);

  const closeModal = useCallback(() => {
    stopScanner();
    onOpenChange(false);
  }, [onOpenChange, stopScanner]);

  const resetFlow = useCallback(() => {
    stopScanner();
    setStage("scan");
    setCameraState("requesting");
    setManualBarcode("");
    setLookupMode(null);
    setLookupProduct(null);
    setErrorMessage(null);
    setNotice(null);
    setSuccessMessage(null);
    setFormValues(getInitialValues(defaultDestination));
  }, [defaultDestination, stopScanner]);

  const updateFormValue = useCallback(
    <Key extends keyof BarcodeConfirmationValues>(
      key: Key,
      value: BarcodeConfirmationValues[Key],
    ) => {
      setFormValues((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const moveToConfirmation = useCallback(
    (
      barcode: string,
      product: BarcodeLookupProduct | null,
      mode: "mock" | "live" | null,
      nextNotice: string | null,
    ) => {
      setLookupMode(mode);
      setLookupProduct(product);
      setNotice(nextNotice);
      setFormValues((current) => ({
        ...current,
        barcode,
        name: product?.title ?? current.name,
        category: product?.category ?? current.category,
      }));
      setStage("confirm");
    },
    [],
  );

  const handleLookup = useCallback(
    (barcodeValue: string) => {
      const normalizedBarcode = normalizeBarcodeValue(barcodeValue);

      if (normalizedBarcode.length < 8 || normalizedBarcode.length > 14) {
        setErrorMessage("Enter a valid UPC or EAN barcode.");
        return;
      }

      stopScanner();
      setStage("lookup");
      setErrorMessage(null);
      setNotice(null);
      setManualBarcode(normalizedBarcode);

      startLookupTransition(async () => {
        try {
          const result = await lookupBarcodeAction({ barcode: normalizedBarcode });

          moveToConfirmation(
            normalizedBarcode,
            result.product,
            result.mode,
            getLookupMessage(result.product, result.mode),
          );
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to look up that barcode.");
          setStage("error");
        }
      });
    },
    [moveToConfirmation, startLookupTransition, stopScanner],
  );

  const openManualBarcode = useCallback(() => {
    stopScanner();
    setStage("manual");
    setErrorMessage(null);
    setNotice(null);
  }, [stopScanner]);

  const openManualItemEntry = useCallback(() => {
    stopScanner();
    setLookupMode(null);
    setLookupProduct(null);
    moveToConfirmation("", null, null, "Manual entry is ready. You can add the item without saving a barcode.");
  }, [moveToConfirmation, stopScanner]);

  useEffect(() => {
    if (!open || stage !== "scan" || !videoRef.current) {
      return;
    }

    let cancelled = false;
    const videoElement = videoRef.current;

    async function startScanner() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStage("camera_unavailable");
        setErrorMessage("Camera access is not available in this browser.");
        return;
      }

      setCameraState("requesting");
      setErrorMessage(null);

      try {
        const stream = await prepareScannerStream();

        if (cancelled) {
          stopMediaStream(stream);
          return;
        }

        streamRef.current = stream;
        videoElement.srcObject = stream;
        await waitForVideoPreview(videoElement);

        if (cancelled) {
          stopMediaStream(stream);
          return;
        }

        setCameraState("ready");

        const reader = new BrowserMultiFormatReader();
        reader.possibleFormats = supportedFormats;
        readerRef.current = reader;

        const controls = await reader.decodeFromStream(stream, videoElement, (result, _error, activeControls) => {
          controlsRef.current = activeControls;

          if (cancelled || !result || hasResolvedScanRef.current) {
            return;
          }

          hasResolvedScanRef.current = true;
          void handleLookup(result.getText());
        });

        if (cancelled) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;
      } catch (error) {
        if (cancelled) {
          return;
        }

        stopMediaStream(streamRef.current);
        streamRef.current = null;
        resetVideoElement(videoElement);
        setCameraState("idle");

        if (isPermissionError(error)) {
          setStage("permission_denied");
          setErrorMessage(
            "Camera access is blocked. You can allow access and retry, or keep moving with manual entry.",
          );
          return;
        }

        if (isCameraUnavailableError(error)) {
          setStage("camera_unavailable");
          setErrorMessage("No compatible camera was found on this device.");
          return;
        }

        setStage("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "The scanner could not start on this device.",
        );
      }
    }

    void startScanner();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [handleLookup, open, stage, stopScanner]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeModal();
      }
    }

    if (!open) {
      return;
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [closeModal, open]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formValues.name.trim()) {
      setErrorMessage("Item name is required.");
      return;
    }

    setErrorMessage(null);

    startSaveTransition(async () => {
      try {
        const result = await saveScannedItemAction({
          ...formValues,
          barcode: normalizeBarcodeValue(formValues.barcode),
          productBrand: lookupProduct?.brand ?? "",
          productImageUrl: lookupProduct?.imageUrl ?? "",
        });

        storeBarcodeFeedback(result);
        setSuccessMessage(result.message);

        window.setTimeout(() => {
          closeModal();

          if (result.path === pathname) {
            router.refresh();
            return;
          }

          router.push(result.path);
        }, 500);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to save the item.");
      }
    });
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="absolute inset-0" onClick={closeModal} aria-hidden="true" />
      <Card className="relative z-10 w-full max-w-3xl overflow-hidden border-border/70 bg-[#f4f1ea] shadow-[0_24px_80px_rgba(30,40,42,0.25)]">
        <CardHeader className="border-b border-border/70 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Included in your plan</Badge>
                <Badge variant="secondary">Barcode scan</Badge>
                {lookupMode === "mock" ? <Badge variant="secondary">Mock lookup</Badge> : null}
              </div>
              <div className="space-y-1">
                <CardTitle className="font-serif text-3xl tracking-[-0.04em]">
                  Scan a household item
                </CardTitle>
                <CardDescription className="max-w-2xl text-base leading-7">
                  Scan once, review once, and send the item straight into the right Weekboard flow.
                </CardDescription>
              </div>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={closeModal} aria-label="Close scanner">
              <X className="size-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4 sm:p-6">
          {successMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-950">
              {successMessage}
            </div>
          ) : null}

          {stage === "scan" ? (
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-[2rem] border border-border bg-slate-950">
                <video
                  ref={videoRef}
                  className="aspect-[4/5] w-full object-cover sm:aspect-[16/10]"
                  autoPlay
                  muted
                  playsInline
                  disablePictureInPicture
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/35 via-transparent to-slate-950/45" />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
                  <div className="h-40 w-full max-w-xs rounded-[1.75rem] border border-white/80 shadow-[0_0_0_999px_rgba(15,23,42,0.26)] sm:h-48" />
                </div>
                {cameraState !== "ready" ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45">
                    <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/65 px-5 py-4 text-center text-white shadow-xl">
                      <LoaderCircle className="mx-auto size-5 animate-spin" />
                      <p className="mt-3 text-sm font-medium">Opening the camera</p>
                      <p className="mt-1 text-xs text-white/75">
                        Weekboard will use the back camera when it is available.
                      </p>
                    </div>
                  </div>
                ) : null}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-5 py-4 text-white">
                  <div>
                    <p className="text-sm font-medium">Center the barcode in the frame</p>
                    <p className="text-xs text-white/75">
                      Optimized for UPC-A, UPC-E, EAN-8, and EAN-13. After a match, Weekboard will show whether it came from the live catalog or local sample data.
                    </p>
                  </div>
                  <div className="flex size-11 items-center justify-center rounded-full bg-white/12">
                    <ScanLine className="size-5" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="button" onClick={resetFlow}>
                  <RefreshCw className="size-4" />
                  Restart camera
                </Button>
                <Button type="button" variant="outline" onClick={openManualBarcode}>
                  <Search className="size-4" />
                  Enter barcode manually
                </Button>
                <Button type="button" variant="ghost" onClick={openManualItemEntry}>
                  Continue without barcode
                </Button>
              </div>
            </div>
          ) : null}

          {stage === "manual" ? (
            <div className="space-y-4">
              <div className="rounded-[1.75rem] border border-border bg-white/70 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Search className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Manual barcode entry</p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      If camera access is unavailable, enter the barcode and Weekboard will try a product match. The result will show whether it came from the live catalog or local sample data.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  value={manualBarcode}
                  onChange={(event) => setManualBarcode(normalizeBarcodeValue(event.target.value))}
                  inputMode="numeric"
                  placeholder="Enter barcode"
                  className="sm:flex-1"
                />
                <Button type="button" onClick={() => handleLookup(manualBarcode)}>
                  <Search className="size-4" />
                  Look up item
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {mockBarcodeExamples.map((example) => (
                  <button
                    key={example.barcode}
                    type="button"
                    onClick={() => setManualBarcode(example.barcode)}
                    className="rounded-full border border-border bg-white px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                  >
                    {example.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="button" variant="ghost" onClick={() => setStage("scan")}>
                  <ArrowLeft className="size-4" />
                  Back to scanner
                </Button>
                <Button type="button" variant="ghost" onClick={openManualItemEntry}>
                  Continue without barcode
                </Button>
              </div>
            </div>
          ) : null}

          {stage === "lookup" ? (
            <div className="rounded-[1.75rem] border border-border bg-white/70 px-6 py-10 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                <LoaderCircle className="size-6 animate-spin" />
              </div>
              <p className="mt-4 text-base font-medium text-foreground">Looking up item details</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Pulling back a clean product match for barcode {manualBarcode}.
              </p>
            </div>
          ) : null}

          {stage === "permission_denied" ? (
            <div className="space-y-4">
              <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50/90 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                    <CameraOff className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-950">Camera access is off</p>
                    <p className="text-sm leading-6 text-amber-900/80">
                      Allow camera access in your browser if you want live scanning, or keep moving with manual entry.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="button" onClick={resetFlow}>
                  <RefreshCw className="size-4" />
                  Retry scanner
                </Button>
                <Button type="button" variant="outline" onClick={openManualBarcode}>
                  <Search className="size-4" />
                  Enter barcode manually
                </Button>
                <Button type="button" variant="ghost" onClick={openManualItemEntry}>
                  Continue without barcode
                </Button>
              </div>
            </div>
          ) : null}

          {stage === "camera_unavailable" ? (
            <div className="space-y-4">
              <div className="rounded-[1.75rem] border border-border bg-white/75 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                    <Smartphone className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">No camera available</p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      This device or browser does not have a usable camera. Manual entry is ready instead.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="button" variant="outline" onClick={resetFlow}>
                  <RefreshCw className="size-4" />
                  Retry scanner
                </Button>
                <Button type="button" onClick={openManualBarcode}>
                  <Search className="size-4" />
                  Enter barcode manually
                </Button>
                <Button type="button" variant="ghost" onClick={openManualItemEntry}>
                  Continue without barcode
                </Button>
              </div>
            </div>
          ) : null}

          {stage === "error" ? (
            <div className="space-y-4">
              <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50/90 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                    <ShieldAlert className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-rose-950">Scanning hit a snag</p>
                    <p className="text-sm leading-6 text-rose-900/80">
                      {errorMessage ?? "The scanner could not start right now."}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="button" onClick={resetFlow}>
                  <RefreshCw className="size-4" />
                  Retry scanner
                </Button>
                <Button type="button" variant="outline" onClick={openManualBarcode}>
                  <Search className="size-4" />
                  Enter barcode manually
                </Button>
              </div>
            </div>
          ) : null}

          {stage === "confirm" ? (
            <BarcodeConfirmationForm
              values={formValues}
              lookupProduct={lookupProduct}
              lookupMode={lookupMode}
              errorMessage={errorMessage}
              notice={notice}
              isPending={isSavePending || isLookupPending}
              storageLocationOptions={storageLocationOptions}
              onChange={updateFormValue}
              onSubmit={handleSubmit}
              onScanAgain={resetFlow}
              onManualBarcode={openManualBarcode}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
