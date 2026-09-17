# Keep tutorial and hack panels clear of play; draw lift front rails over passengers

The tutorial's bottom task panel hides street enemies when the player jumps onto rooftops. The hack terminal also covers targets on its fixed right side, and the elevator's complete image behind passengers makes them overlap its front rails.

- Use one compact tutorial task card that avoids actors. Hide large dialogue during movement, jumps and Rhythm Combat, preserving unread text, Continue ownership and closing time.
- Extend clear placement and preserved reading time to lore and inspection; make objectives and transient prompts yield to active reading.
- Position the hack terminal/result using projected target, player and other enemy bounds. Use a short six-column keypad when the side layout would hide action. Keep clear placement steady, compact only when needed, and align keypad/Cancel pointer regions with the actual panel.
- Split the existing elevator image into rear and front draw regions so passengers sit behind front rails. Preserve rooftop and below-floor depth, one actor draw and existing movement/collision/power rules.

Validation: required full local suite and all-JavaScript syntax; targeted production checks cover hidden tutorial state, 24 camera/zoom/target cases with moved pointer controls, and lift draw ordering/support. Sixteen inspected native stills use existing bundled art. Exact revision, CI and limits are recorded in the source receipt.

Base/rollback: merged #77, `78f67f4750a2d12f8a2063c895d06d5b9952d700`. No dependencies or image replacements. Owner Makko and physical-controller acceptance remain pending before assistant merge.
