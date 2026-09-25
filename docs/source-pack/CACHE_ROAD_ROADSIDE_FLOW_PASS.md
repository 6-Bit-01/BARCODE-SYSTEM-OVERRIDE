# Cache Road staggered roadside and surface pass — September 25, 2026

Base: merged #127, `273a1df9d400a8eeaca40e3f30e38f80929720e7`.
This follows the owner's review of the curved-crest correction. That pass
fixed the roof/footing reveal; its sites still arrived across from one
another at almost every fixed station, faded in, and stood beyond mostly
empty side terrain. The city crops also widened architecture unnaturally.

## What moves together

- Left and right addresses now follow separate seeded world-distance
  sequences. The first market and house remain an authored opening; later
  gaps include short runs and longer open intervals, with only occasional
  facing addresses. In the first lap there are eighteen sites and three
  near-facing arrivals. Each site retains an independent size and an
  18–263-unit lateral setback. A type gets a visible-distance cooldown so a
  whole building does not repeat at two sizes in one vista. Low filler uses
  staggered phases on the two banks rather than paired positions.
- Buildings and locales keep their complete illustrated source, road-facing
  orientation, curved crest and outer-sidewalk clearance. Their alpha is
  fully opaque from the first visible roof pixel; the crest alone reveals
  the distant art. Parcel and parking ground also draw without a distance
  fade. City atmosphere remains softer by depth.
- Three new transparent, individually painted city panoramas replace the
  widened crops. They overscan the 1920-unit viewport at widths 2520, 2420
  and 2370, respectively. Each uses a uniform source aspect ratio and a
  shared road-bearing pan with increasing parallax. Their lower architecture
  sits behind a gently curved horizon; Reduced Motion fixes the pan.
- New sidewalk slab, wet outer ground, green plot and service plot assets
  are projected as world-fixed quads from the same centerline and road depth
  as the curb, parcel, streetlights and sites. The surface continues through
  gaps between buildings. Park, house and garden approaches get the green
  material; construction, garage, substation and parking get a harder
  service material. The open lot retains its individual painted bays.

The old transparent panoramic paintings are retained in source history, and
the new PNG painting sources accompany optimized WebP runtime assets. The
surface assets are editable SVGs. The new art is pinned to the published
asset revision so a Makko import that omits local binary files can still
load it. Traffic positions, pad timing, controls, music stems, saves and
campaign awards were not changed.

## Motion review and evidence

The actual Canvas road renderer was inspected at opening, middle, near and
late positions. Two separate 32-second/15-fps scripted drives cover the
first and third laps, including bends and the passes of sites. These are
visual draws, not a playable Makko capture or an audio test. Selected frames
are in `review-cache-roadside-flow/`: `opening.webp`, `stagger.webp`,
`later-bend.webp`, and `third-lap.webp`.

The draw test checks opaque sites, staggered one-sided intervals versus
occasional pairs, exterior clearance and facing, curved roof reveal,
same-site growth, the complete park, road-following surfaces, uniform city
aspect ratios, a shared camera pan and Reduced Motion. Repository/CI results
belong to the exact revision receipt. Owner normal-size Makko visual,
controller, audio and performance acceptance remains open.

A public driver-POV city approach was located as a visual pacing reference
([Pexels clip](https://www.pexels.com/video/driving-on-highway-with-city-skyline-view-36067575/));
its video stream was unavailable in this workspace, so no claim is made
about having inspected its individual frames. The game's two continuous
drives are the motion evidence for this pass.

## Next owner review

Drive the merged build at normal and slower speed, then watch a single
house, park and industrial plot from first roof through the side pass.
Compare empty intervals against paired arrivals and inspect the sidewalk
edge on a bend. Repeat on a later lap and in Reduced Motion. The next small
touches, if useful, are occasional curb cuts lined up with real entrances,
isolated signage rather than mirrored signs, and pools of lamp reflection
on the panels. Hold those until the new site rhythm has been judged in Makko.

The adrenaline/action/music cohesion audit and the six requested power-up
families remain in `CACHE_ROAD_COHESION_AUDIT.md` for the later mechanics
pass.
