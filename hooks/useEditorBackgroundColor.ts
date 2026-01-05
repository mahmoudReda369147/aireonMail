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

  return {
    bgColor,
    setBgColor,
    wrapWithFullHTML,
  };
};
