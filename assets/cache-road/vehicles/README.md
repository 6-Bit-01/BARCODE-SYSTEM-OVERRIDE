# Cache Road vehicle art

The transparent PNG sources were recovered from the owner's saved art review
files. The game loads optimized WebP copies beside this README:

| Runtime file | Recovered source title | Use |
| --- | --- | --- |
| `cache-center.webp` | Golden anime tuner with crest | Default Cache Back car |
| `cache-left.webp` | Left-steering golden tuner hatchback | Held right steer after owner visual correction |
| `cache-right.webp` | Right-steering golden tuner hatchback | Held left steer after owner visual correction |
| `cache-hit.webp` | Yellow Hatchback Collision Jolt | 650 ms collision reaction |
| `freight.webp` | Pixel-Art Rear-View Freight Truck | Freight traffic |
| `courier.webp` | Sea-glass broadcast courier hatchback | Van traffic |
| `barricade.webp` | Portable amber-striped road barricade | Fixed block |
| `rival.webp` | Rearview magenta scan vehicle | Final rival |

The original animation source was not saved with these images. In the game,
`drawVehicle` keeps the rear tire pixels at road contact while the chassis
rocks independently. Freight has a slower, larger suspension travel. Tread
detail moves through the rear tires, and a narrow side rim turns within the
visible wheel during steering. Cache throws wet spray and uses the recovered
collision pose with a decaying jolt. These are rebuilt runtime animations,
not a recovered sprite sheet. Reduced Motion holds bounce, spray and tire
movement. Procedural silhouettes remain as loading fallback for the other
traffic kinds and failed image requests.
