#!/usr/bin/env python3
"""Generate speech with Chatterbox Nano (Mac-friendly: mps/cpu)."""

from __future__ import annotations

import argparse
from pathlib import Path

import torch
import torchaudio as ta
from chatterbox.tts_turbo import ChatterboxTurboTTS


def pick_device(requested: str) -> str:
    if requested != "auto":
        return requested
    if torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def main() -> None:
    parser = argparse.ArgumentParser(description="Chatterbox Nano TTS helper")
    parser.add_argument("text", help="Text to speak (supports tags like [chuckle])")
    parser.add_argument(
        "-o",
        "--out",
        default="media/embeds/audio/chatterbox-nano.wav",
        help="Output wav path",
    )
    parser.add_argument(
        "-r",
        "--ref",
        default=None,
        help="Reference wav for voice cloning (recommended ~10s)",
    )
    parser.add_argument(
        "--device",
        choices=("auto", "mps", "cpu", "cuda"),
        default="auto",
        help="Inference device (default: auto → mps if available else cpu)",
    )
    parser.add_argument(
        "--turbo",
        action="store_true",
        help="Use Turbo 350M instead of Nano 110M",
    )
    args = parser.parse_args()

    device = pick_device(args.device)
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)

    print(f"Loading Chatterbox {'Turbo' if args.turbo else 'Nano'} on {device}…")
    model = ChatterboxTurboTTS.from_pretrained(device=device, nano=not args.turbo)

    kwargs = {}
    if args.ref:
        kwargs["audio_prompt_path"] = args.ref

    print("Generating…")
    wav = model.generate(args.text, **kwargs)
    ta.save(str(out), wav, model.sr)
    print(f"Saved {out} @ {model.sr} Hz")


if __name__ == "__main__":
    main()
