"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";

interface IntroModalProps {
  onClose: () => void;
}

const STORAGE_KEY = "hasSeenIntro";

export function IntroModal({ onClose }: IntroModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasSeen = window.localStorage.getItem(STORAGE_KEY) === "1";
    if (!hasSeen) {
      setOpen(true);
      document.body.classList.add("modal-scroll-lock");
    } else {
      onClose();
    }
  }, [onClose]);

  const handleClose = () => {
    setOpen(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
    document.body.classList.remove("modal-scroll-lock");
    onClose();
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-3xl bg-slate-900 p-10 text-left align-middle shadow-panel transition-all">
                <Dialog.Title className="text-3xl font-semibold">
                  Deine Emotionale Stadt
                </Dialog.Title>
                <div className="mt-6 space-y-4 text-base text-slate-200">
                  <p>
                    Wo fühlst du dich in Berlin besonders wohl? Diese Karte sammelt
                    Eindrücke von Menschen und zeigt Emotionen und
                    Umweltwahrnehmungen in den Stadtteilen.
                  </p>
                  <p>
                    Nutze die Filter, um unterschiedliche Emotionen, Orte und
                    Datenmengen zu vergleichen. Die farbigen Hexagone zeigen den
                    Durchschnitt der ausgewählten Orte.
                  </p>
                </div>

                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    onClick={handleClose}
                    className="inline-flex items-center justify-center rounded-full bg-primary-300 px-6 py-3 text-lg font-semibold text-slate-950 transition hover:bg-primary-400"
                  >
                    Jetzt Karte erkunden
                  </button>
                  <div className="flex gap-6 text-sm text-slate-400">
                    <button
                      type="button"
                      onClick={() => window.open("/impressum.html", "_blank")}
                      className="underline underline-offset-4 hover:text-white"
                    >
                      Impressum
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open("/datenschutz.html", "_blank")}
                      className="underline underline-offset-4 hover:text-white"
                    >
                      Datenschutz
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
