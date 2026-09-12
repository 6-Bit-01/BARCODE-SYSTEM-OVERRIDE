# Opening artwork and character references

The owner explicitly requested the missing intro images, required character models first, then supplied 15 reference files. These current models govern the opening. The earlier guessed group draft was rejected and is not a project asset. This completes the eight-page opening's artwork within the existing draft review; it does not change the playable cast or later revelations.

Only 6 Bit, Cache Back, Cliff, DJ Floppydisc and Mac Modem may be visibly identifiable in the intro. All other characters remain offscreen or fully obscured. Sheila remains silhouette-only if a later approved shot depicts her; the present opening does not depict her. Cliff has one brief maintenance cameo on page 2. The original four carry the broadcast, dialogue and decisions.

## Model mapping

| Character | Supplied model files | Features to preserve |
|---|---|---|
| 6 Bit | `6BitFace(1).png`, `6BitFullBodyFront(1).png`, `6BitFullBodySide(1).png`, `6BitWaistUpSide(1).png` | Long brown hair; black 6 Bit cap with green underside; angular black/silver clear glasses; white irises; black paint surrounding both eyes; white nose/cheek paint with downward points; bare mouth, chin and forehead; layered black long cardigan/vest, black shirt, cargo trousers, gloves, wrist straps and boots |
| Cache Back | `openart-image_sUa578AT_1765587750737_raw(1).png` | Yellow cap with two rounded side protrusions; short dark hair, brown eyes, clear black glasses; angular lower-face mask and dark mechanical collar; yellow short sleeves, black Greek-key trim and circular shoulder/back emblem |
| Cliff | The four supplied `openart-image_177432…` green-background files | Messy thinning hair, tired eyes, salt-and-pepper stubble, beige staff jacket, blue polo, headset and clipboard; green is a reference backdrop, not his costume |
| DJ Floppydisc | `openart-image_H5RWJcvi_1772147226771_raw(1).png` | Living human; swept brown hair, narrow moustache, cyan waveform visor, rolled white sleeves, black waistcoat and bow tie, floppy-disk pin, subtle metallic forearm seams |
| Mac Modem | `openart-image_y8BzeKUf_1771482003518_raw(1).png`, `openart-image_1Jy267qY_1771483756922_raw(1).png`, `openart-image_jWL5HfqQ_1771484902321_raw(1).png` | Ginger beard and two thin side braids, red eyes, black MODEM cap, white face paint with fine red signal arcs and asymmetric black circuitry, burgundy/red vest, black shirt, tattooed arms and pendant; red costume model guides this sequence |

The two additional photo references remain available for later likeness adjustments. Original uploaded files are unmodified. Their filenames and SHA-256 digests are recorded with the production prompts in `assets/intro/art-manifest.json`.

## Eight connected scenes

| Page / beat | Bundled asset | Action and continuity |
|---|---|---|
| 1 / O1 | `intro-01-broadcast.webp` | 6 Bit and DJ finish a live session together; warm amber studio, microphone, console and tape |
| 2 / O1 | `intro-02-keep-the-take.webp` | Mac routes the signal and Cache records it; Cliff's clipboard/cable/coffee interruption stays in the background |
| 3 / O2 | `intro-03-dead-return.webp` | The receiver becomes static and a flat trace; DJ pauses and 6 Bit questions the report |
| 4 / O3 | `intro-04-preserve.webp` | Cache physically protects the original recording while Mac restores outside access |
| 5 / O3 | `intro-05-listen.webp` | DJ isolates something surviving beneath the static; two traces seed the later comparison |
| 6 / O4 | `intro-06-refusal.webp` | 6 Bit pushes open the door; the recovery caption crosses its frame as he rejects waiting |
| 7 / O5 | `intro-07-district.webp` | A local street leads toward the distant established lattice tower; 6 Bit has not already reached it |
| 8 / O5 | `intro-08-keep-it-open.webp` | 6 Bit steps into the neighborhood with the four crew channels still connected |

The scenes share hand-inked contours, angular cel shading, restrained halftone/paper texture, lived-in musical equipment and amber/cyan/plum lighting. Camera distance and action change with the story. The previous SO10 image informs the tower structure only; old crew portraits are not runtime fallbacks. Decorative posters show silhouettes or music motifs, not additional identifiable cast.

## Integration and review

The built-in `image_gen.imagegen` tool generated one illustration per scene using the inspected current models. `assets/intro/art-manifest.json` preserves each complete prompt, ordered references, original generated filename/hash, dimensions and production-file hash. The original generated PNGs remain unchanged. Runtime copies are WebP quality 96 at their original approximately 1862×845 dimensions (about 2.2:1), with no semantic editing or production cropping. The eight assets total approximately 5.2 MiB.

CutsceneSystem loads the eight relative assets from the same repository as `index.html`. IntroSequence maps one main scene to each page and draws selected scene details in the side panels. Nameplates use white for 6 Bit, cyan for DJ, yellow for Cache and red for Mac. Dialogue and system captions remain rendered text. The accessible transcript includes the visual action. A bounded two-second scope trace and the existing displaced caption use the existing presentation poll; reduced effects use static endpoints.

Run `node tools/render-intro.cjs` to render the complete production page path from the bundled assets. It fails on missing/undecodable art and asserts text bounds. The contact sheet, full pages, skip state and reduced-effects state are in `verification/`. These are native Canvas diagnostics; actual Makko import, fullscreen, audible transition and hardware controls still require owner review before merge.

The script remains in `INTRO_OVERHAUL.md`. It follows the merged campaign map; new art does not resolve the creator, 9 Bit's motive, ending or collection thresholds. HUD/rhythm/attack-variety work follows completion of this intro review.
