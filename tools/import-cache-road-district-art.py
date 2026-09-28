"""Import transparent masters once and reproduce runtime WebP exports.

The maintained v5 source pack contains the PNG masters. Extract its
repository-snapshot into the clone before re-exporting WebP. When an authorized
generation source is present beside the repo it refreshes that master first.
Foot and alpha fit are checked separately; original pixels are not edited.
"""
from pathlib import Path
from shutil import copyfile
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
GEN = ROOT.parent / 'generated_images'
BLOCKS = ROOT / 'assets/cache-road/world/blocks'
MATERIALS = ROOT / 'assets/cache-road/world/materials'

BLOCKS_MAP = {
    'workshop-L-rear':'737236d0-6aa1-43f0-ac43-33e700520c6e',
    'workshop-L-middle':'8d4b1026-55a5-449e-bd12-78e0ecfacf3b',
    'greenhouse-L-rear':'03e8691d-52a8-42a6-89de-eebd4173fbb8',
    'greenhouse-L-middle':'d31cddbc-5ded-4ed2-b13d-3e8295c2af14',
    'greenhouse-L-front-gap':'07d988e4-1142-4681-b427-4e9e95d19bfa',
    'greenhouse-L-front-fill':'d9deaca4-7800-4122-9cd2-fe1d12709a95',
    'greenhouse-R-rear':'bbac2984-7942-4616-9d75-7fb21c5013cd',
    'greenhouse-R-middle':'c9191b54-e5c6-45e0-b0b2-46fa30382a15',
    'greenhouse-R-front-gap':'2a1c9bb5-d31e-48eb-9ca9-c29830c3f841',
    'greenhouse-R-front-fill':'2a0f161f-acd5-45be-b995-b2fe42947ac9',
    'data-L-rear':'23471e4d-1508-40ff-bb5f-fef9b8c9722e',
    'data-L-middle':'494cf8d8-e32b-4641-8696-295c40f324d3',
    'data-L-front-gap':'cfd94585-1e7c-4b72-9457-749a9ed8680c',
    'data-L-front-fill':'51001082-fe4e-4f0f-a4eb-2386e4b1f5cd',
    'data-R-rear':'95a5ad48-8942-4a09-a0a2-06719fdc8ce6',
    'data-R-middle':'2ad7e123-4c3d-49b7-8810-7dfe4b216230',
    'data-R-front-gap':'0f907d65-61c4-4659-8fb2-c6e4c9d5e09e',
    'data-R-front-fill':'ab30c3b5-165c-4df2-86de-2d734e5e7030',
    'transit-L-rear':'a8c2b83a-300a-495a-8aa5-1a971ee8dc54',
    'transit-L-middle':'9b003046-d266-4162-91d7-cc4a83ff7828',
    'transit-L-front-gap':'edd6d5c2-7fb2-48c2-9f00-268bb8c9f2eb',
    'transit-L-front-fill':'947ab47e-1368-4842-9aee-0bc12e99bd74',
    'transit-R-rear':'2a660e2e-5755-426d-ad7a-7a6ed43708ae',
    'transit-R-middle':'b00e3723-3dd4-434b-9b0b-387f9be625ee',
    'transit-R-front-gap':'499bcb13-d7fe-4284-ba5b-a3a84062e3ef',
    'transit-R-front-fill':'bbc89c95-42e2-4c28-a37d-59a867a3d2da',
}
MATERIAL_MAP = {
    'residential-paving':'d0836a89-4590-4f45-8ed1-70c02be814d8',
    'service-court-paving':'7be113b5-71da-4295-bbdf-4c4bc7008396',
    'planted-gravel-court':'8b3ecb43-db7f-4cc8-96c1-2699c424e054',
}
WALKERS = {
    'courier-toward':'1d047483-c809-4405-8c5f-1cc0db0fb99d',
    'courier-away':'47fc8f95-d3a7-470c-be90-020f1db6c394',
    'market-worker-toward':'5abbe921-a169-4bc2-9f3b-c458f8f336f2',
    'market-worker-away':'df7436aa-643e-4291-86a5-bddb57ed9c83',
    'mechanic-toward':'9c6aeba0-7991-40cb-926f-83c9cf6bde16',
    'mechanic-away':'01dd3c1f-8ea0-4ab7-b4ec-0d165d83792a',
    'student-toward':'ea61e079-ebb4-46f2-ab4e-a274e2e1c134',
    'student-away':'93cc99a9-7dcc-4ffe-a30e-c5fd7487db92',
    'gardener-toward':'877b5eaa-e2f9-4581-8df7-c84426b5afe3',
    'gardener-away':'2540510e-4784-42ef-a471-248451c07252',
    'resident-toward':'3724917e-dfc0-4d70-a725-6a04c46e534f',
    'resident-away':'1ffd4de0-c1d9-4c55-b023-051112bab616',
}
PROPS = {
    'lamp-L':'3891c768-db23-4ced-bd46-09f0c98dae4e',
    'lamp-R':'da338e72-9760-4f3b-8948-09ab78ffc3a6',
    'crossing-signal-L':'71d64f1d-0b2a-4e65-8d6a-57df7cf45446',
    'crossing-signal-R':'d539c7c7-08b3-4795-9a36-7c6de9f6d399',
    'wayfinding-sign':'e3b97fcf-cac8-4453-b05e-2ad528d16a2a',
    'bins-recycling':'d8aad3e3-b519-4936-97c8-37f0b105f36f',
    'loading-crates':'3abc9e42-fed1-43c2-a4e9-620c61efe80f',
    'utility-cabinet':'40e7f8a1-3174-46e8-88cd-fb83f213fb30',
    'vendor-cart':'a0d1c148-4de3-4ea1-9b01-218dc62a700e',
    'fence-planter':'aa3bb059-c708-44b5-98f4-6264875e96ed',
}

def import_art(name, uid, directory, prefix=''):
    source = GEN / f'exec-{uid}.png'
    master = directory / 'sources' / f'{prefix}{name}.png'
    runtime = directory / f'{prefix}{name}.webp'
    master.parent.mkdir(parents=True, exist_ok=True)
    if source.exists():
        copyfile(source, master)
    elif not master.exists():
        raise FileNotFoundError(master)
    with Image.open(master) as im:
        im.save(runtime, 'WEBP', quality=87, method=6)
        print(name, im.size, im.mode)

if __name__ == '__main__':
    for name, uid in BLOCKS_MAP.items():
        import_art(name, uid, BLOCKS, 'block-')
    for name, uid in MATERIAL_MAP.items():
        import_art(name, uid, MATERIALS)
    props = ROOT / 'assets/cache-road/world/props'
    for name, uid in WALKERS.items():
        import_art(name, uid, props, 'walker-')
    for name, uid in PROPS.items():
        import_art(name, uid, props, 'street-')
