# Cache Road world art

`skyline.webp` is prepared from the saved transparent
`Rain-Soaked Retro-Futurist Skyline.png`. `distant-city.webp` and
`mid-city.webp` are separate generated transparent paintings, with their PNG
sources under `sources/`. They move at increasing speeds behind the road:
distant small buildings, recovered far skyline, then near industrial facades.
The sky's color, ribbons and haze move with the shared music beat, active part
count and Turbo; Reduced Motion holds their geometry. Level 1's animated
`ship-1.webp` and `ship-3.webp` fly through this layer at varied apparent
depths and angles without collision behavior.

The road keeps Level 1's `assets/wet-street/rain-blacktop.webp`, subdued over
dark asphalt. Its perspective bands now sample adjoining texels, blend the one
vertical wrap, and no longer draw artificial wet seams. Section lines remain
faint, with part markings above the texture. Roadside art is documented in
`../roadside/README.md`. This is production draw code, not the old composite.
