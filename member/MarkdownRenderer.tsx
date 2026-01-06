import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  // Parse markdown-like content and render with proper styling
  const renderContent = (text: string) => {
    if (!text) return null;

    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let currentList: string[] = [];
    let listType: 'ul' | 'ol' | null = null;
    let inCodeBlock = false;
    let codeContent = '';
    let codeLanguage = '';

    const flushList = () => {
      if (currentList.length > 0) {
        const ListTag = listType === 'ol' ? 'ol' : 'ul';
        elements.push(
          <ListTag 
            key={elements.length} 
            className={cn(
              "my-2 ml-4",
              listType === 'ol' ? "list-decimal" : "list-disc"
            )}
          >
            {currentList.map((item, i) => (
              <li key={i} className="text-sm leading-relaxed">{parseInlineMarkdown(item)}</li>
            ))}
          </ListTag>
        );
        currentList = [];
        listType = null;
      }
    };

    const parseInlineMarkdown = (text: string): JSX.Element | string => {
      // Bold: **text** or __text__
      const boldRegex = /\*\*(.+?)\*\*|__(.+?)__/g;
      // Italic: *text* or _text_
      const italicRegex = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)|(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g;
      // Code: `text`
      const codeRegex = /`([^`]+)`/g;
      // Links: [text](url)
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

      let result = text;
      
      // Replace bold
      result = result.replace(boldRegex, '<strong class="font-semibold">$1$2</strong>');
      // Replace italic
      result = result.replace(italicRegex, '<em class="italic">$1$2</em>');
      // Replace code
      result = result.replace(codeRegex, '<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');
      // Replace links
      result = result.replace(linkRegex, '<a href="$2" class="text-primary underline hover:no-underline" target="_blank" rel="noopener">$1</a>');

      if (result === text) return text;
      return <span dangerouslySetInnerHTML={{ __html: result }} />;
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Code block
      if (trimmedLine.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={elements.length} className="my-3 p-4 bg-muted rounded-lg overflow-x-auto">
              <code className="text-xs font-mono">{codeContent.trim()}</code>
            </pre>
          );
          codeContent = '';
          codeLanguage = '';
          inCodeBlock = false;
        } else {
          flushList();
          inCodeBlock = true;
          codeLanguage = trimmedLine.slice(3);
        }
        return;
      }

      if (inCodeBlock) {
        codeContent += line + '\n';
        return;
      }

      // Headers
      if (trimmedLine.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={elements.length} className="text-base font-semibold mt-4 mb-2 text-foreground">
            {parseInlineMarkdown(trimmedLine.slice(4))}
          </h3>
        );
        return;
      }
      if (trimmedLine.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={elements.length} className="text-lg font-semibold mt-4 mb-2 text-foreground">
            {parseInlineMarkdown(trimmedLine.slice(3))}
          </h2>
        );
        return;
      }
      if (trimmedLine.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={elements.length} className="text-xl font-bold mt-4 mb-2 text-foreground">
            {parseInlineMarkdown(trimmedLine.slice(2))}
          </h1>
        );
        return;
      }

      // Horizontal rule
      if (trimmedLine === '---' || trimmedLine === '***' || trimmedLine === '___') {
        flushList();
        elements.push(<hr key={elements.length} className="my-4 border-border" />);
        return;
      }

      // Blockquote
      if (trimmedLine.startsWith('> ')) {
        flushList();
        elements.push(
          <blockquote key={elements.length} className="border-l-4 border-primary/50 pl-4 my-2 italic text-muted-foreground">
            {parseInlineMarkdown(trimmedLine.slice(2))}
          </blockquote>
        );
        return;
      }

      // Unordered list
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        if (listType !== 'ul') {
          flushList();
          listType = 'ul';
        }
        currentList.push(trimmedLine.slice(2));
        return;
      }

      // Ordered list
      const orderedMatch = trimmedLine.match(/^\d+\.\s(.+)/);
      if (orderedMatch) {
        if (listType !== 'ol') {
          flushList();
          listType = 'ol';
        }
        currentList.push(orderedMatch[1]);
        return;
      }

      // Empty line
      if (trimmedLine === '') {
        flushList();
        return;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p key={elements.length} className="text-sm leading-relaxed my-1">
          {parseInlineMarkdown(trimmedLine)}
        </p>
      );
    });

    // Flush any remaining list
    flushList();

    return elements;
  };

  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
      {renderContent(content)}
    </div>
  );
}
