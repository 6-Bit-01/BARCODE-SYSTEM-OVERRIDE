# Cache Road diagonal scene and instrument art — September 25, 2026

The owner corrected the previous side-road treatment: a horizontal frontage
cannot become the desired place merely by slicing and projecting it. This pass
uses six newly painted transparent perspective cutouts. Market, relay depot
and quieter service frontage each have separate left and right artwork. Their
roofs, windows, door scale, sidewalk, plinth and paving seams already converge
toward the distance in the source pixels. `SIDE_ART` registers two painted curb
points to the shared road projection and draws each complete sprite once. It
does not vertically slice or rescale individual facades. The continuous side
deck, world-fixed joints, walkers, parapet and lamps remain underneath/in front
as appropriate and travel at the same road speed. Overlapping quiet frontage
rows cover the intervals beneath brighter authored events.

| Source cutout | Native near end | Native far end |
| --- | --- | --- |
| `market-left-perspective` | Lower left, wide occupied shop/pavement | Upper right, small connected shops |
| `market-right-perspective` | Lower right | Upper left |
| `depot-left-perspective` | Lower left, work bay | Upper right, small service bays |
| `depot-right-perspective` | Lower right, relay garage | Upper left |
| `frontage-left-perspective` | Lower left, quiet garage row | Upper right |
| `frontage-right-perspective` | Lower right | Upper left |

Editable transparent PNGs are in `assets/cache-road/roadside/sources/`; matching
optimized WebPs are runtime art. The old horizontal paintings remain in Git as
historical source but are no longer loaded or drawn. The image-generation
prompt set and reference roles are in the roadside `DIAGONAL_PROMPTS.md`.

The road pad now has a dark physical inlay, rivets, restrained beat edge and
four vector action marks: double impulse (Surge), wedge (Push), shield (Brace)
and coil (Refill). The actual keyboard/controller glyph remains live text from
ControllerSettings. The pad stays at its authored position below traffic and
remains painted after a catch until it passes the car. Music phrase bars use
four separate lane motifs and short, gapped color inlays rather than a broad
color plane. Queued marks are quieter than active ones; the four-bar boundary
still crosses the road. The matching HUD instrument cells show each part and
remaining bars around Cache Back's rearview. The left and right panels group
driving state and the next pad; Push/Brace arm state remains visible. All art
motions follow the existing song/road clocks and Reduced Motion preference.

The scripted seven-chapter production draw includes a queued bar, one/two/three
parts and a four-part peak. It is a visual fixture, not a Makko playthrough or
audio judgment. The focused proof checks whole diagonal sprite placement,
shared approach with frontage/lamps and existing pad/traffic/song invariants.
After merge, import the exact main SHA into Makko and use the first acceptance
route. Judge scene seams, normal and braking speed, road-pad legibility under
traffic, mapped controller glyphs, full-stack road clarity and the sound/feel
of a hit. Gameplay balance and the power-up concepts remain open.
