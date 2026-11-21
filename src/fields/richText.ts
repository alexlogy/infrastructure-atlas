import {
  BoldFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  lexicalEditor,
  OrderedListFeature,
  ParagraphFeature,
  UnorderedListFeature,
} from '@payloadcms/richtext-lexical'

/** Deliberately small editor for public prose; matches what `RichText` renders safely. */
export const publicRichTextEditor = lexicalEditor({
  features: [
    ParagraphFeature(),
    BoldFeature(),
    ItalicFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
    // External links only: internal document links could expose unpublished records.
    LinkFeature({ enabledCollections: [] }),
    InlineToolbarFeature(),
  ],
})
