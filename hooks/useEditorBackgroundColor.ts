import { useState, useCallback } from 'react';

export const useEditorBackgroundColor = (initialColor: string = '#0F1020') => {
  const [bgColor, setBgColor] = useState(initialColor);

  const wrapWithFullHTML = useCallback((content: string) => {
    return `<table width="100%" cellpadding="0" cellspacing="0" style="background-color:${bgColor}; margin:0; padding:0;">
  <tr>
    <td style="padding:20px;">
      ${content}
    </td>
  </tr>
</table>`;
  }, [bgColor]);

  // Extract background color from wrapped HTML
  const extractBgColorFromHTML = useCallback((html: string): string | null => {
    if (!html) return null;

    // Match the first table's background-color style
    const match = html.match(/style="[^"]*background-color:\s*([^;"\s]+)/i);
    if (match && match[1]) {
      return match[1];
    }

    return null;
  }, []);

  // Unwrap the HTML to get the inner content
  const unwrapHTML = useCallback((html: string): string => {
    if (!html) return '';

    // Match content inside the innermost <td style="padding:20px;">
    const match = html.match(/<td style="padding:20px;">\s*([\s\S]*?)\s*<\/td>\s*<\/tr>\s*<\/table>\s*$/i);
    if (match && match[1]) {
      return match[1].trim();
    }

    // If no match, return the original HTML (it might not be wrapped)
    return html;
  }, []);

  return {
    bgColor,
    setBgColor,
    wrapWithFullHTML,
    extractBgColorFromHTML,
    unwrapHTML,
  };
};
