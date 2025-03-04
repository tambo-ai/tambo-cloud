# Hydra AI Landing Page

## Fonts

This project uses a combination of fonts to create a cohesive and visually appealing typography system:

### Font Configuration

All fonts are configured in a single location: `lib/fonts.ts`. This file exports the following fonts:

- **Sentient** (Serif font for headings and accent text)
- **Geist Sans** (Primary sans-serif font)
- **Geist Mono** (Monospace font)

### Sentient Font

The Sentient font is used as a accent font for headings and accent text. It's configured with the following weights:

- **Light (300)**: Sentient-Light.woff2
- **Light Italic (300 italic)**: Sentient-LightItalic.woff2
- **Bold (700)**: Sentient-Regular.woff2 (using Regular as Bold)
- **Bold Italic (700 italic)**: Sentient-Italic.woff2 (using Italic as Bold Italic)

#### Font Files Location

The Sentient font files are stored in:

```
public/assets/fonts/sentient-light/
├── Sentient-Light.woff2
├── Sentient-LightItalic.woff2
├── Sentient-Regular.woff2
├── Sentient-Italic.woff2
```

### Using Fonts in Your Components

#### Tailwind Classes

The fonts are available through the following Tailwind classes:

- `font-sans`: Default sans-serif font (Geist Sans)
- `font-mono`: Monospace font (Geist Mono)
- `font-sentient`: Sentient font
- `font-heading`: Sentient font (alias for headings)

#### Font Weight and Style

Use standard Tailwind classes to control font weight and style:

- `font-light`: Light weight (300)
- `font-bold`: Bold weight (700)
- `italic`: Italic style

#### Examples

```tsx
// Default sans-serif text
<p className="font-sans">
  This text uses the default sans-serif font (Geist Sans).
</p>

// Sentient Light (300 weight)
<p className="font-sentient font-light">
  This text uses Sentient Light.
</p>

// Sentient Light Italic
<p className="font-sentient font-light italic">
  This text uses Sentient Light Italic.
</p>

// Sentient Regular as Bold (700 weight)
<p className="font-sentient font-bold">
  This text uses Sentient Regular as Bold.
</p>

// Heading example
<h2 className="font-heading text-2xl font-bold">
  This heading uses Sentient.
</h2>
```

### Adding New Fonts

To add a new font to the project:

1. If using Google Fonts, add it to the imports in `lib/fonts.ts`
2. If using a local font:
   - Add the font files to `public/assets/fonts/[font-name]/`
   - Configure the font in `lib/fonts.ts` using `localFont()`
3. Add the font variable to the HTML class in `app/layout.tsx`
4. Add the font to the `fontFamily` section in `tailwind.config.ts`
