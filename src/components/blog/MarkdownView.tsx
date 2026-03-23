'use client'

import { Children, isValidElement } from 'react'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { isImagePath, isVideoPath } from '@/lib/blog/media'

export function MarkdownView({ value }: { value: string }) {
  return (
    <div className="text-gray-900">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          h1: props => <h1 className="text-2xl font-semibold mt-6 mb-3" {...props} />,
          h2: props => <h2 className="text-xl font-semibold mt-5 mb-2" {...props} />,
          h3: props => <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />,
          p: ({ children, ...props }) => {
            const nodes = Children.toArray(children)
            const onlyChild = nodes.length === 1 ? nodes[0] : null

            if (isValidElement(onlyChild) && onlyChild.type === 'video') {
              return <div className="my-3" {...props}>{children}</div>
            }

            return <p className="leading-7 my-3" {...props}>{children}</p>
          },
          a: props => (
            isVideoPath(props.href ?? '') ? (
              <video
                controls
                preload="metadata"
                className="my-4 w-full rounded-lg border border-gray-200 bg-black"
                src={props.href}
              >
                Ваш браузер не поддерживает видео.
              </video>
            ) : (
              <a
                className="text-blue-600 hover:underline break-words"
                target="_blank"
                rel="noreferrer"
                {...props}
              />
            )
          ),
          img: props => {
            const src = props.src ?? ''

            if (!isImagePath(src)) {
              return null
            }

            return (
              <Image
                src={src}
                alt={props.alt ?? ''}
                width={1200}
                height={800}
                sizes="100vw"
                unoptimized
                className="my-4 h-auto max-w-full rounded-lg border border-gray-200"
              />
            )
          },
          ul: props => <ul className="list-disc pl-6 my-3 space-y-1" {...props} />,
          ol: props => <ol className="list-decimal pl-6 my-3 space-y-1" {...props} />,
          li: props => <li className="leading-7" {...props} />,
          blockquote: props => (
            <blockquote
              className="border-l-4 border-gray-300 pl-4 my-3 text-gray-700"
              {...props}
            />
          ),
          code: props => (
            <code
              className="px-1 py-0.5 rounded bg-gray-100 text-sm"
              {...props}
            />
          ),
          pre: props => (
            <pre className="p-3 rounded bg-gray-100 overflow-auto my-3" {...props} />
          ),
          hr: props => <hr className="my-6 border-gray-200" {...props} />,
        }}
      >
        {value}
      </ReactMarkdown>
    </div>
  )
}
