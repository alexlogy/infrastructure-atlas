import type {
  SerializedEditorState,
  SerializedLexicalNode,
} from '@payloadcms/richtext-lexical/lexical'
import {
  type JSXConverterArgs,
  type JSXConvertersFunction,
  RichText as PayloadRichText,
} from '@payloadcms/richtext-lexical/react'

import { isSafeHref } from '@/lib/validation/links'

type LinkLikeNode = {
  type: 'link' | 'autolink'
  children: SerializedLexicalNode[]
  fields?: { url?: string; newTab?: boolean; linkType?: 'custom' | 'internal' }
}

/**
 * Payload's default link converter emits the stored URL as-is. This one renders
 * only safe external hrefs; internal or unsafe links degrade to plain text.
 */
const safeLink = ({ node, nodesToJSX }: JSXConverterArgs<LinkLikeNode>) => {
  const { children, fields } = node
  const content = nodesToJSX({ nodes: children })
  const url = fields?.url ?? ''
  if (fields?.linkType === 'internal' || !isSafeHref(url)) return <>{content}</>
  return (
    <a
      href={url}
      rel={fields?.newTab ? 'noopener noreferrer' : undefined}
      target={fields?.newTab ? '_blank' : undefined}
    >
      {content}
    </a>
  )
}

const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  link: safeLink,
  autolink: safeLink,
})

export function RichText({ data, className }: { data: SerializedEditorState; className?: string }) {
  return <PayloadRichText data={data} converters={converters} className={className} />
}
