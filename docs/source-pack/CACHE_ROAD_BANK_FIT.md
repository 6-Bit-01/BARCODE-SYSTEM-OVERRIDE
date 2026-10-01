# Cache Road side orientation and terrain contact

The owner reported roadside pictures on the wrong bank and pieces jutting
above the landscape after merged PR #162. Base/rollback is
`a664160dbaa4670444190222cfb56354ad6352e9`; the repair branch is
`agent/cache-road-side-fit`.

House and park were explicitly audited as native LEFT, but the old
doorway-based rule flipped them on the left and left them native on the
right. Both cameras now preserve the higher inner contact and lower outer
ground taper. Source pixels, world addresses, widths, setbacks and
conservative parcel reservations remain intact.

Six smaller contextual paintings also had the opposite bank assumption.
They are native RIGHT by their inspected paving/contact shape. A shared
source fit drives district accents, occupied courts and satellite frontages
in both cameras. The shallow homes strip retains its facing and receives
only a neutral center contact; its near-flat base does not establish a
different handedness.

| Source key | Native bank / facing | Source foot u | Opaque contact y |
| --- | --- | ---: | ---: |
| `cacheTransitNook` | RIGHT | .14 | 725 |
| `cacheUtilityCorner` | RIGHT | .14 | 665 |
| `cacheGreenhouseWorkshop` | RIGHT | .14 | 828 |
| `cacheOutskirtsWorkshops` | RIGHT | .14 | 708 |
| `cacheRepairShop` | RIGHT | .14 | 940 |
| `cacheVendorStall` | RIGHT | .14 | 959 |
| `cacheOutskirtsHomes` | Existing facing retained | .50 | 698 |

Contacts are independently measured from the committed WebP at alpha >128,
using source x = round(u × (width − 1)). Mirroring resolves the contact to
`1 − u` before sampling terrain at its actual projected x. The image's draw
y compensates for pixels below that contact, so transparent bitmap margins
no longer lift the painted footing. Existing small ground biases remain.
No burial mask, image warp, outward relocation or source-art replacement is
used. The 48 explicitly handed family cards retain their source keys and
contact/socket metadata.

## Review and validation

`tools/render-cache-road-bank-fit.cjs` loads all registered cache assets and
uses the production main/rear drawing paths at actual generated addresses.
It stages camera state only. Four views follow each target through approach,
middle, near and passed-rear positions. Targets cover house/park on both
banks, every curated variant, six families on both banks and all contextual
sources. Its JSON records source/asset hashes, camera state, actual painter
submissions, facing and measured contacts. Run it from the repository:

```
node tools/render-cache-road-bank-fit.cjs <output-directory>
```

The bank-art regression independently reads source alpha, checks eight bank
slopes and nine opaque feet, and compares actual production main/rear
contacts with the camera and terrain geometry. Clearance, complete
foreground exits and all 48 core contacts remain separate checks. Full
regression, all-file syntax and both final-head Chromium CI events gate the
existing publication workflow. Exact test results and publication revision
belong to the generated receipt and PR.

These fixtures establish source-facing and geometric placement. They do not
establish Makko performance, physical-controller behavior or the owner's
appearance acceptance. Refresh the exact tested revision for the focused
Makko review; check both sides through a bend and the complete close pass.
Driving rules, beat ONE, buffered gears, five-source music, saves/rewards,
the wide horizon and exact rearview `blur(2.3px)` remain unchanged.
