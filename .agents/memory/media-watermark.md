---
name: Property media watermarking
description: How property image watermarking works and the gotcha that public display must opt into the watermarked URL
---

# Property media watermarking

Images uploaded to a property via the `/properties/:id/media/upload` endpoint are automatically watermarked with the brand logo (sharp composite, logo bottom-right). Both the original and the watermarked file are stored, and the media row keeps `url` (original) and `watermarkedUrl`.

**Gotcha:** watermarking on upload is not enough — every public-facing surface must explicitly render `watermarkedUrl || url`. The original `url` is unwatermarked, so any display that maps `.url` directly leaks unwatermarked images. The admin uploader preview and public property card / listing detail must all prefer `watermarkedUrl`.

**Why:** the watermark exists to protect listing photos shown to visitors; showing `.url` defeats the purpose even though the watermarked file was generated.

**How to apply:** when adding any new component that shows property photos, map `(m) => m.watermarkedUrl || m.url`. Media uploaded before the feature existed has a null `watermarkedUrl` and correctly falls back to the original.

## Main image selection

A property's `mainImageUrl` is derived, not stored: it's the `type=photo` media row with the lowest `order` (`where type=photo orderBy order limit 1`), resolved in several places in `properties.ts`. There is no `isMain` flag on `property_media`.

To let an agent pick the main photo, the "set main" endpoint reorders the property's media so the chosen photo gets `order=0` (others shift up). **Why:** keeping a single source of truth (`order`) avoids an `isMain` flag that could drift out of sync with ordering. **How to apply:** reorder writes must be atomic — wrap the select + per-row `order` updates in a `db.transaction`, or concurrent reorders/uploads/deletes can leave no row at `order=0` and break main-image resolution.
