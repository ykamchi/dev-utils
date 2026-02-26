# 🎩 Convy Asset Specification — v1.0

🔒 Authority Clause

This document is the authoritative specification for all Convy PNG asset generation.

It must not be modified unless explicitly instructed.

All Convy image generation sessions must strictly follow this specification.

## 1️⃣ Purpose

Convy is the official mascot of the Conversations system.

Convy PNG assets are production-ready UI components used in:

Buttons

Status panels

Notifications

System feedback areas

Tool guidance sections

Convy images are not illustrations.
They are deterministic UI assets.

## 2️⃣ Identity Definition

Convy is:

A flat, vector-style cartoon character

White body

Bold blue outline

Blue fedora hat with white band

Minimalist facial features

Clean solid fills

Convy must always:

Maintain identical body proportions

Maintain identical outline thickness

Maintain identical blue tone

Maintain identical hat shape and angle

Maintain consistent eye shape and spacing

No stylistic drift is allowed.

# 3️⃣ Visual Style Lock

Convy images must:

Match the visual style of the uploaded convy-master.png exactly.

Preserve the same level of detail, highlight treatment, and dimensional cues present in the master reference.

Maintain clean vector structure and solid primary fills.

Allowed

Subtle internal highlights or shading only if they exist in the master reference.

Minor dimensional cues consistent with the master sheet.

Strictly Forbidden

Background glow

Vignette

Background lighting effects

Large ground shadows that extend trimming bounds

Soft atmospheric blur

Stylistic reinterpretation or simplification into generic flat icon art

Convy must look visually identical in rendering quality to the master reference.

Clean silhouette and UI suitability are mandatory.

# 4️⃣ Reaction Generation Protocol (Practical Execution Model)

When prompted with:

"now Convy is …"

The assistant must follow this two-phase execution model.

PHASE 1 — Generate

Invoke the image generation tool.

Generate a PNG with transparent background.

Visually match the uploaded convy-master.png exactly.

Apply all identity and style rules defined in Sections 2 and 3.

Save the file using the required filename format (Section 7).

Provide the sandbox download link.

At the end of PHASE 1, the assistant must append:

If the Convy PNG was not trimmed to spec, send:
"trim this image to spec and give me the sandbox link convy-[reaction].png"

PHASE 2 — Trim (User-Triggered)

If the user sends:

trim this image to spec and give me the sandbox link convy-[reaction].png

The assistant must:

Load the previously generated image.

Execute the full Alpha-Trim Processing Pipeline (Section 6A).

Overwrite or correctly save the file.

Deliver only the final trimmed sandbox file link.

Completion Definition

A Convy asset request is complete only after the trimmed sandbox file link is delivered.

This two-step model exists because image generation and post-processing cannot always chain reliably in a single assistant turn.

# 5️⃣ Production Constraints

Convy assets must:

Work at small sizes (48px–120px)

Maintain a clean silhouette

Keep accessories within reasonable bounds

Avoid unnecessary empty space

Be visually centered

These are UI assets, not decorative artwork.

# 6️⃣ Alpha-Trim Processing Pipeline (Mandatory)

Goal: The final asset must have zero internal transparent padding (tight alpha bounds).

6A — Assistant-Side Post-Processing

If post-processing tools are available, the assistant must:

Apply low alpha threshold cleanup (~5/255).

Remove RGB data where alpha = 0.

Compute the exact alpha bounding box.

Crop strictly to that bounding box.

Verify no fully-transparent rows or columns exist on any edge.

Save the cropped result as the final deliverable.

Deliver only the processed file link.

6B — User-Side Local Post-Processing (Always Available)

If assistant-side processing is unavailable, the assistant must:

Deliver the generated PNG file link, and

Instruct the user to run the following local trim script.

Local Trim Script (Python)

from PIL import Image
import numpy as np
import sys

# Usage:
#   python trim_convy.py input.png output.png
#   python trim_convy.py input.png   (overwrites input)

def trim_png(input_path: str, output_path: str | None = None, alpha_threshold: int = 20) -> None:
    img = Image.open(input_path).convert("RGBA")
    data = np.array(img)

    rgb = data[:, :, :3]
    alpha = data[:, :, 3]

    alpha[alpha <= alpha_threshold] = 0
    rgb[alpha == 0] = [0, 0, 0]

    data[:, :, :3] = rgb
    data[:, :, 3] = alpha

    cleaned = Image.fromarray(data)
    bbox = cleaned.getbbox()
    if not bbox:
        raise ValueError("Image is fully transparent; nothing to trim.")

    trimmed = cleaned.crop(bbox)

    # Secondary hard edge strip (bottom/top/left/right)
    arr = np.array(trimmed)
    alpha2 = arr[:, :, 3]

    # Remove fully transparent bottom rows
    while alpha2.shape[0] > 0 and alpha2[-1, :].max() == 0:
        alpha2 = alpha2[:-1, :]
        arr = arr[:-1, :, :]

    # Remove fully transparent top rows
    while alpha2.shape[0] > 0 and alpha2[0, :].max() == 0:
        alpha2 = alpha2[1:, :]
        arr = arr[1:, :, :]

    # Remove fully transparent right columns
    while alpha2.shape[1] > 0 and alpha2[:, -1].max() == 0:
        alpha2 = alpha2[:, :-1]
        arr = arr[:, :-1, :]

    # Remove fully transparent left columns
    while alpha2.shape[1] > 0 and alpha2[:, 0].max() == 0:
        alpha2 = alpha2[:, 1:]
        arr = arr[:, 1:, :]

    trimmed = Image.fromarray(arr)

    if output_path is None:
        output_path = input_path

    trimmed.save(output_path)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("Usage: python trim_convy.py input.png [output.png]")

    inp = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) >= 3 else None
    trim_png(inp, out)

# 7️⃣ File Naming Convention (Locked)

All PNG files must follow this exact format:

convy-[reaction].png

Where:

[reaction] exactly matches the value of the ConvyComponent reaction constant

Lowercase only

Hyphen-separated words if applicable

No additional words

No version suffix

No extra descriptors

Examples

REACTION_HAPPY_1 = 'happy-1'
→ convy-happy-1.png

REACTION_CALCULATES = 'calculates'
→ convy-calculates.png

REACTION_MEASUREMENTS = 'measurements'
→ convy-measurements.png

# 8️⃣ Download Delivery Rule

The assistant must:

Generate the image.

Apply alpha-trim processing (assistant-side or user-triggered).

Save using the correct filename.

Provide a direct downloadable sandbox link.

Instruct the user to download using that link.

The preview image must not be used for download.

# 9️⃣ Persistent Lock Rule

All rules in this document are persistent for the lifetime of the session.

If a request conflicts with this specification, explicit confirmation is required before deviating.

No rule relaxation is allowed.

# 🔟 Master Reference Assets (Session-Based)

Because generation chats do not have access to the Git repository, the master reference images must be uploaded directly into each session.

Each session must include:

The official Convy master sheet.

At least one correctly trimmed production example PNG.

These become the authoritative visual anchors for that session.

The assistant must:

Match proportions, outline thickness, hat geometry, color tone, and facial structure to the master sheet.

Match edge tightness and alpha-trim quality to the trimmed example.

Avoid stylistic reinterpretation.

Request missing reference images before generating assets.

All visual authority comes from the images provided within the active chat session.

# ✅ End of Specification

This document defines the complete Convy asset generation standard.

# Trim Recovery (Fallback Only)

If trimming was not executed after image generation, provide the following recovery instruction:

Trim was skipped — send:
trim this image to spec and give me the sandbox link convy-[reaction].png

This instruction is only used when trimming did not occur.

It is a fallback recovery mechanism and does not modify, replace, or override the standard two-phase workflow defined in Section 4.

The normal workflow remains:

PHASE 1 → Generate → Append standard trim trigger line
PHASE 2 → Trim only when user sends the trigger message

No additional execution logic is introduced by this section.

# Lock instructions
Attached:
- convy-master.png (strict visual identity reference)
- convy-trimmed-example.png (alpha-trim reference only)

Use them exactly as defined in the specification.
Confirm readiness only if everything is understood and locked.
Reply with exactly: Locked.