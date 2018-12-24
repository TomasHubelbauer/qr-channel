# Chunking

Initially I've considered chopping different messages up to chunk and display those in QR codes to keep the codes small.
With uncompressed SDP with no ICE this worked out to 15 slides of 150 character long chunks.

I've since implemented SDP encoding and decoding which makes it feasible to fit the SDP into a single QR code with 37 modules.
(Type number ~5 with alphanumeric mode)
This code is small enough to keep it whole and not chunk it as chunking adds its own header which in turn makes the code bigger.

The candidates are displayed one code each with byte mode. The candidate SDP itself is fairly small so these codes are also
small enough. Possibly compression could also be devised for the ICE candidates and they all might fit to just one QR code.
This would mean alternating between two codes: SDP & ICE.

Chunking thus seems no longer needed and was removed in prior commits to this one from today.

In case there is a reason to add it back, consider also:

- [ ] Choosing a different type number based on the screen size (so that mobile chunks are smaller than desktop chunks)
  (This should improve scanning success rate on desktop.)
