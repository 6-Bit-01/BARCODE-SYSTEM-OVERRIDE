# Mac city — dynamic street pass

The owner authorized the next playable pass: running, readable standing and moving guards, grabs with pummels and carries, usable melee weapons and firearms, street props and power-ups. This extends the private Mac chapter. The accepted complete-character artwork, six districts, twelve encounters, boss, two story choices and shared runtime owners remain the baseline.

## Character animation

Every new action uses an authored complete character cel. The production target is nineteen new poses: standing guard and two guarded creep contacts; four running contacts/passes; grab reach and hold; pummel load and contact; carry hold and two steps; melee load, contact and follow-through; firearm aim and recoil. A held pose can serve recovery when the action returns naturally to it. The existing accepted walk, jump, unarmed attacks, damage and defeat clips stay intact.

Each sheet records a measured upright reference height. Mac's head, torso, clothing and shoes retain the accepted model and common scale across actions; crouching or extending a weapon changes the silhouette without resizing the body. Grounded poses use a consistent floor baseline and a pivot under the supported body, with no vertical lift. Simulation phase/age selects the held cel. No new animation timer, body-part rig or rotated limb is introduced.

Weapons must read as complete objects in the hand, with a registered grip and firing origin if they are separate native item cels. Character and item placement follow the same facing and floor registration. A firearm muzzle flash or blood impact can be a separate effect; an arm cannot.

Armed idle, walking and jumping retain the accepted complete-character clips. Supplemental registration calibrates their closed-fist grips without changing the original base JSON or images. Open-palm carry poses apply to carried street objects. An actual hit drops the weapon according to combat state; rendering must not make it disappear during ordinary movement.

The agreed combat contract uses a 1.65× run and a 0.22× guarded creep. Enemy grips last one to three seconds according to strength, with real pummel attacks bounded within that grip. Carried street objects have no arbitrary carry timeout; throwing, damage and chapter/lifecycle transitions release them. A separate release age prevents a long hold from skipping the throw's authored commitment.

## Street proportions and placement

Use the accepted renderer's 260-unit Mac/normal-fighter height as the visual reference; the boss remains 335. Prop targets are: crate 104 high, barrel 117, coupe 175.5 high and roughly 390–400 wide, van 227.5 high, terminal 240.5, streetlamp 500, stall 299 and relay 266.5. These preserve the intended proportions against the actual actor size. Broken states use the intact object's pixel density, so debris becomes lower instead of stretching back to intact height. Items rest on the street plane, and feet, wheels and broken debris share their lane-ground contact. Spawn placement must preserve a clear fighting lane and avoid appearing inside doors, storefront walls or one another.

Vehicle and prop placement will be checked against the native cel silhouettes as well as their crop dimensions. Buildings and Kave's enclosed studio remain background spaces; interaction props cannot accidentally turn the studio into an open street stage.

## Ownership and acceptance

Combat owns movement, guard state, target attachment, damage, action phases, inventory and pickup/prop state. The authored-frame module validates registrations and samples cels. The existing preview owns loading, rendering and effects; contextual touch controls expose the actions that are available. Existing input, audio, pause and lifecycle owners remain responsible for their resources.

This document records approved scope and production targets, not completed gameplay or accepted artwork. Final native assets, focused registration/action checks and private hosted playtesting are required before release review. Owner visual/gameplay acceptance, physical-phone performance and the final Mac song remain separate gates. No production publication or merge is authorized by this review document.
