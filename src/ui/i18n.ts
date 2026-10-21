import {useEffect, useState} from 'react';

export type Locale = 'zh-TW' | 'en';
const storageKey = 'openmind.locale';
const eventName = 'openmind:locale-change';

const english: Record<string, string> = {
  '繁體中文': '繁體中文', 'English': 'English', '語言': 'Language',
  '我的主題': 'My Topics', '加入附件時已切換工作表，請重新選取附件。': 'The sheet changed while adding the attachment. Select it again.', '附件目標已刪除。': 'The attachment target was deleted.',
  '階層與摘要': 'Hierarchy & Summary', '插入上層主題': 'Insert Parent Topic', '建立選取摘要': 'Create Summary from Selection', '移除': 'Remove', '連結至主題': 'Link to Topic', '選擇文件內的主題': 'Choose a topic in this document',
  '更多文字與線條樣式': 'More Text & Line Styles', '字型': 'Font', '文字字型': 'Text Font', '襯線／繁中回退': 'Serif / Traditional Chinese fallback', '等寬／繁中回退': 'Monospace / Traditional Chinese fallback', '對齊': 'Alignment', '文字對齊': 'Text Alignment', '靠左': 'Left', '置中': 'Center', '靠右': 'Right',
  '填色透明度': 'Fill Opacity', '外框粗細': 'Border Width', '連接線': 'Relationship Lines', '連接線樣式': 'Line Style', '曲線': 'Curved', '折線': 'Elbow', '直線': 'Straight', '水平間距': 'Horizontal Spacing', '水平分支間距': 'Horizontal Branch Spacing', '垂直間距': 'Vertical Spacing', '垂直分支間距': 'Vertical Branch Spacing', '虛線外框': 'Dashed Boundary',
  '複製樣式': 'Copy Style', '貼上樣式': 'Paste Style', '重設樣式': 'Reset Style', '貼圖、公式與附件': 'Images, Equations & Attachments', '貼圖': 'Image', '節點貼圖': 'Topic Image', '無貼圖': 'No Image', '數學公式（TeX／AMS）': 'Math Formula (TeX / AMS)', '節點公式': 'Topic Formula', '例如 \\frac{a+b}{c}': 'For example, \\frac{a+b}{c}', '加入附件（每檔 2 MB）': 'Add Attachment (2 MB each)', '主題與範本': 'Themes & Templates', '套用主題': 'Apply Theme', '選擇主題': 'Choose a Theme', '自訂主題名稱': 'Custom Theme Name', '已保存自訂主題，可套用至其他文件。': 'Custom theme saved. It can be applied to other documents.', '保存目前樣式為主題': 'Save Current Style as Theme', '範本名稱': 'Template Name', '我的範本': 'My Templates', '已保存範本；新增心智圖時可選用。': 'Template saved. You can choose it when creating a mind map.', '保存文件為範本': 'Save Document as Template',
  '正在讀取本機文件…': 'Loading local documents…', '準備儲存': 'Ready to save', '無法連線至更新服務，請稍後再試。': 'Could not connect to the update service. Try again later.', '簡報模式': 'Presentation Mode', '列印工作室': 'Print Studio', '軟體更新': 'Software Update', '操作指南': 'Quick Guide', '建立心智圖': 'Create a Mind Map', '編輯主題': 'Edit Topic',
  '最近文件備份失敗；請確認已下載原生檔案。': 'A recent-document backup failed. Make sure you have downloaded a native file.', '另一個視窗正在編輯': 'Another window is editing this document', '唯讀保護已啟用': 'Read-only protection is on', '正在儲存…': 'Saving…', '已儲存於此裝置': 'Saved on this device', '儲存失敗，請下載檔案': 'Save failed. Download a copy of the file.', '舊文件無法寫入最近清單；請確認已下載檔案。': 'This older document could not be added to Recents. Make sure you have downloaded a copy.', '新主題': 'New Topic', '無法移動：中心主題不可移動，分支也不能移入自己的子樹。': 'Cannot move this topic: the central topic cannot be moved, and a branch cannot be moved into its own subtree.', '自由主題': 'Floating Topic', '中央主題無法剪下；可複製整張心智圖。': 'The central topic cannot be cut. You can copy the entire mind map.', '已剪下分支；可在 OpenMind 內貼上。': 'Branch cut. Paste it in OpenMind.', '已複製分支；可在 OpenMind 內貼上。': 'Branch copied. Paste it in OpenMind.', '請先在 OpenMind 複製分支，或將文字貼入節點編輯框。': 'Copy a branch in OpenMind first, or paste text into a topic editor.', '已下載原生檔案；包含全部工作表與樣式。': 'Native file downloaded with all sheets and styles.',
  '搜尋心智圖': 'Search mind map', '專案規劃': 'Project Plan', '我的新專案': 'My New Project', '學習筆記': 'Study Notes', '我想學會的事': 'What I Want to Learn', '展開': 'Expand', '收合': 'Collapse', '完成': 'Done', '待辦': 'To do', 'OpenMind 首頁': 'OpenMind Home', '文件名稱': 'Document Name', '未命名心智圖': 'Untitled Mind Map', '失敗': 'Failed', '僅儲存於本機': 'Stored locally only', '開啟檔案': 'Open File', '儲存檔案': 'Save File', '儲存檔案 ⌘S': 'Save File ⌘S', '檢查更新': 'Check for Updates', '更新': 'Update', '列印與 PDF': 'Print & PDF', '切換深色模式': 'Toggle Dark Mode', '新增心智圖': 'New Mind Map', '工作空間': 'Workspace', '目前心智圖': 'Current Map', '最近文件': 'Recent Files', '工作表': 'Sheets', '新增工作表': 'Add Sheet', '讓想法躍然紙上': 'Bring Your Ideas to Paper', '選擇可讀分頁，讓大型心智圖的每個字都清晰。': 'Choose readable pagination to keep every topic clear, even on large maps.', '探索列印工作室': 'Explore Print Studio', '自由開源 · 離線可用': 'Open source · Works offline', '心智圖': 'Mind Map', '大綱': 'Outline', '任務': 'Tasks', '簡報': 'Presentation', '復原': 'Undo', '復原 ⌘Z': 'Undo ⌘Z', '重做': 'Redo', '重做 ⇧⌘Z': 'Redo ⇧⌘Z', '子主題': 'Child Topic', '新增同層 Enter': 'Add Sibling Enter', '新增同層主題': 'Add Sibling Topic', '複製分支': 'Copy Branch', '聚焦選取分支': 'Focus Selected Branch', '聚焦分支': 'Focus Branch', '預覽選取分支': 'Preview Selected Branch', '離開編輯專注模式': 'Exit Focused Editing', '展開編輯專注模式': 'Expand Focused Editing', '返回工作區': 'Back to Workspace', '專注': 'Focus', '匯出': 'Export', '文字與階層': 'Text & Hierarchy', '目前完整／聚焦畫布': 'Full / Focused Canvas', '另存原生檔案': 'Save a Native Copy', '切換屬性面板': 'Toggle Inspector',
  '留住每一次靈感。': 'Keep every spark of inspiration.', '文件保存在這個裝置的本機空間。下載原生檔案，可自行備份與分享。': 'Documents stay in this device’s local storage. Download a native file to back up or share it.', '開始新的想法': 'Start a New Idea', '返回完整心智圖': 'Back to Full Mind Map', '用文字整理脈絡，與心智圖同步編輯。': 'Organize ideas in an outline that stays in sync with the mind map.', '搜尋想法、標籤或筆記': 'Search ideas, labels, or notes', '清除搜尋': 'Clear Search', '搜尋範圍': 'Search In', '所有內容': 'Everything', '備註': 'Notes', '標籤': 'Labels', '沒有符合的節點': 'No matching topics', '唯讀模式': 'Read-only', '本機自動復原已啟用': 'Local recovery is enabled', '格式與內容': 'Format & Content', '更多操作': 'More Actions', '主題': 'Topic', '選取的節點': 'Selected Topics', '內容': 'Content', '主題文字': 'Topic Text', '節點文字': 'Topic Text', '結構': 'Structure', '圖表結構': 'Map Structure', '形狀': 'Shape', '節點形狀': 'Topic Shape', '圓角矩形': 'Rounded Rectangle', '矩形': 'Rectangle', '膠囊': 'Pill', '文字與外觀': 'Text & Appearance', '文字大小': 'Text Size', '粗體': 'Bold', '斜體': 'Italic', '文字顏色': 'Text Color', '填滿顏色': 'Fill Color', '自訂填滿顏色': 'Custom Fill Color', '外框顏色': 'Border Color', '註記與標籤': 'Notes & Labels', '節點備註': 'Topic Notes', '記下想法背後的細節…': 'Add details behind this idea…', '標籤（逗號分隔）': 'Labels (comma-separated)', '靈感, 待討論': 'Idea, To Discuss', '連結': 'Link', '節點連結': 'Topic Link', 'https://… 或 openmind:節點ID': 'https://… or openmind:topic-id', '僅支援 http、https、mailto 或 openmind 連結。': 'Only http, https, mailto, and openmind links are supported.', '此節點連結的目標不存在。': 'The target of this topic link does not exist.', '開啟連結': 'Open Link', '標記': 'Marker', '節點標記': 'Topic Marker', '無標記': 'No Marker', '狀態': 'Status', '任務狀態': 'Task Status', '不設為任務': 'Not a Task', '進行中': 'In Progress', '已完成': 'Completed', '開始日期': 'Start Date', '截止日期': 'Due Date', '分支操作': 'Branch Actions', '展開分支': 'Expand Branch', '收合分支': 'Collapse Branch', '上移': 'Move Up', '下移': 'Move Down', '重點分支': 'Highlight Branch', '分支外框': 'Branch Boundary', '選取兩個節點建立關係線': 'Select two topics to create a relationship', '相關': 'Related', '關係線文字': 'Relationship Label', '刪除關係線': 'Delete Relationship', '外框文字': 'Boundary Label', '刪除外框': 'Delete Boundary', '插入圖片': 'Insert Image', '移除圖片': 'Remove Image', '刪除節點': 'Delete Topic', '工作表與主題': 'Sheets & Topics', '工作表名稱': 'Sheet Name', ' 副本': ' Copy', '複製工作表': 'Duplicate Sheet', '刪除工作表': 'Delete Sheet', '畫布背景': 'Canvas Background', '套用清晰分支色票': 'Apply a clear branch palette', '已複製節點樣式。': 'Topic style copied.',
  '檔案超過 20 MB。': 'File exceeds 20 MB.', '圖片超過 2 MB，請先縮小。': 'Image exceeds 2 MB. Reduce its size first.', '圖片讀取失敗，請重新選取。': 'Could not read the image. Select it again.', '加入圖片時已切換文件，請重新選取圖片。': 'The document changed while adding the image. Select it again.', '圖片目標已刪除。': 'The image target was deleted.', '取消編輯': 'Cancel Editing', '編輯主題文字': 'Edit Topic Text', 'Shift + Enter 換行 · Enter 完成': 'Shift + Enter for a new line · Enter to finish', '完成編輯': 'Finish Editing',
  '今天，想展開什麼？': 'What would you like to explore today?', '關閉新增視窗': 'Close New Document Window', '空白心智圖': 'Blank Mind Map', '從一個想法開始': 'Start with one idea', '整理目標，找到下一步': 'Organize goals and find the next step', '串連知識，建立自己的脈絡': 'Connect knowledge and build your own context', '目前的心智圖會保留在「最近文件」。重要文件請另存 .openmind 備份。': 'This mind map stays in Recent Files. Save important documents as .openmind backups.', '讓思考保持流暢。': 'Keep your thinking flowing.', '關閉指南': 'Close Guide', '選取節點後，使用工具列或快捷鍵編輯。按住 Shift 點選多個節點，拖曳到另一節點可改變父層，按住 Option 拖曳可插到同層前方。': 'Select topics and use the toolbar or keyboard shortcuts to edit. Hold Shift while selecting multiple topics. Drag onto another topic to change its parent, or hold Option while dragging to insert it before a sibling.', 'F2 / 雙擊': 'F2 / Double-click', '編輯文字': 'Edit Text', '復原／重做': 'Undo / Redo', '複製／剪下／貼上分支': 'Copy / Cut / Paste Branch', '儲存／另存新檔': 'Save / Save As', '列印／搜尋': 'Print / Search', '以游標位置縮放': 'Zoom at Pointer', '方向鍵': 'Arrow Keys', '父子與同層導航': 'Navigate Parents, Children & Siblings', 'Windows／Linux 使用 Ctrl 取代 ⌘。核心功能離線可用，無帳號、無遙測。瀏覽器自動儲存受容量與清除資料影響，請保留原生檔案。尚未支援 XMind 格式、AI 推理及多人協作。': 'On Windows and Linux, use Ctrl instead of ⌘. Core features work offline with no account or telemetry. Browser autosave is subject to storage limits and browser data clearing; keep native files. XMind files, AI features, and collaboration are not yet supported.', '另一個 OpenMind 視窗正在編輯。本視窗目前唯讀；關閉另一個視窗後，這裡會自動載入最新資料並接手。': 'Another OpenMind window is editing this document. This window is read-only; it will load the latest data and take over when the other window closes.', '無法確認其他視窗的編輯權，因此本視窗以唯讀方式開啟。請使用已開啟的 OpenMind 視窗編輯，或匯出副本。': 'This window opened read-only because it could not verify editing ownership. Edit in the other OpenMind window or export a copy.', '關閉更新視窗': 'Close Update Window', '目前版本': 'Current Version', '重新啟動並安裝': 'Restart and Install', '重新檢查': 'Check Again', '關閉通知': 'Dismiss Notification',
  '分支預覽': 'Branch Preview', '關閉分支預覽': 'Close Branch Preview', '預覽包含所有子節點': 'Preview includes all child topics', '展開此分支': 'Expand This Branch', '本機工作空間': 'Local Workspace', '自由思考，清晰展開': 'Think Freely, Expand Clearly', '專注分支': 'Focused Branch', '心智圖畫布': 'Mind Map Canvas', 'Tab 新增子主題': 'Tab: Add Child Topic', 'Enter 新增同層': 'Enter: Add Sibling', '雙擊編輯': 'Double-click to Edit', '拖曳改變階層 · ⌥ 拖曳插入同層': 'Drag to Reparent · ⌥-drag to Insert as Sibling', '選取工具': 'Select Tool', '平移工具': 'Pan Tool', '框選工具': 'Marquee Select Tool', '縮小': 'Zoom Out', '放大': 'Zoom In', '適應整張心智圖': 'Fit Mind Map', '返回中央': 'Return to Center',
  '返回編輯': 'Back to Editing', '投影片順序': 'Slide Order', '全螢幕': 'Full Screen', '正在輸出…': 'Exporting…', '匯出簡報 PDF': 'Export Presentation PDF', '加入主題': 'Add Topic', '加入簡報的主題': 'Topics in Presentation', '加入投影片': 'Add Slide', '還原分支順序': 'Restore Branch Order', '上一張投影片': 'Previous Slide', '← 上一張': '← Previous', '暫停播放': 'Pause', '自動播放': 'Auto-play', '下一張投影片': 'Next Slide', '下一張 →': 'Next →', '← → 導航 · Space 播放／暫停 · Esc 返回': '← → Navigate · Space Play/Pause · Esc Return',
  '頁': 'Page', 'pt 最小主題字級': 'pt minimum topic font size', '項列印提醒': 'print notices', '主題文字達到設定字級 · Noto Sans TC 隨檔嵌入': 'Topic text meets the selected size · Noto Sans TC is bundled', '可縮放列印預覽': 'Zoomable Print Preview', '上一頁': 'Previous Page', '預覽頁碼': 'Preview Page Number', '第': 'Page', '頁 ·': 'Page ·', '下一頁': 'Next Page', '預覽縮小': 'Zoom Preview Out', '預覽原始大小': 'Show Preview at 100%', '預覽放大': 'Zoom Preview In', '預覽適合視窗': 'Fit Preview to Window', '適合視窗': 'Fit to Window', '關係索引': 'Relationship Index', '· 列印比例': '· Print Scale', '% · 虛線為可印範圍': '% · Dashed lines mark the printable area', '項續頁／關係提示': 'continuation / relationship cues', '本頁跨頁提示': 'Cross-page Cues on This Page', '前往第': 'Go to Page', '海報排列預覽 ·': 'Poster Layout Preview ·', '張紙': 'sheets', '海報排列預覽': 'Poster Layout Preview', '完整跨頁關係索引：第': 'Full Cross-page Relationship Index: Page',
  '單頁完整': 'Fit on One Page', '保留整張心智圖的空間關係': 'Keep the full map layout intact', '可讀分頁': 'Readable Pagination', '重排階層，維持最低文字大小': 'Reflow the hierarchy to preserve readable text', '海報拼接': 'Poster Tiling', '保留原圖比例，多頁接合': 'Keep the original scale across joined pages', '主要分支分頁': 'Main-Branch Pagination', '依最低字級自動分頁，保留祖先脈絡': 'Automatically paginate by main branch while preserving ancestor context', '選取分支': 'Selected Branch', '只列印選取節點及其子樹': 'Print only the selected topic and its subtree', '大綱列印': 'Outline Print', '階層式文字，適合長篇內容': 'Hierarchical text, suited to long documents', '列印設定': 'Print Settings', '列印策略': 'Print Strategy', '紙張與版面': 'Paper & Layout', '紙張尺寸': 'Paper Size', '自訂': 'Custom', '方向': 'Orientation', '列印方向': 'Print Orientation', '橫向': 'Landscape', '直向': 'Portrait', '寬度 mm': 'Width (mm)', '紙張寬度': 'Paper Width', '高度 mm': 'Height (mm)', '紙張高度': 'Paper Height', '邊界 mm': 'Margins (mm)', '列印邊界': 'Print Margins', '最低字級 pt': 'Minimum Font Size (pt)', '最低字級': 'Minimum Font Size', '重疊 mm': 'Overlap (mm)', '海報重疊': 'Poster Overlap', '頁首': 'Header', '頁尾': 'Footer', '顯示頁碼': 'Show Page Numbers', '保留畫布背景': 'Keep Canvas Background', '黑白省墨模式': 'Black-and-White Ink-Saving Mode', 'Noto Sans TC 以 OFL 授權隨程式提供，並嵌入 PDF。部分符號與罕見字可能使用系統回退字型。實體印表機的紙張與邊界仍需實際確認。': 'Noto Sans TC is bundled under the OFL and embedded in PDFs. Some symbols and rare characters may use system fallback fonts. Confirm paper size and margins on the physical printer.', '專注預覽 · ← → 翻頁 · Esc 返回設定': 'Focused Preview · ← → Turn Pages · Esc Return to Settings', '每一個好想法，都值得被看清楚。': 'Every good idea deserves to be seen clearly.', '離開專注預覽': 'Exit Focused Preview', '展開專注預覽': 'Expand Focused Preview', '返回設定': 'Back to Settings', '專注預覽': 'Focused Preview', '列印': 'Print', '正在嵌入字型…': 'Embedding fonts…', '輸出 PDF': 'Export PDF', '列印／另存 PDF': 'Print / Save as PDF',
  '任務與甘特圖': 'Tasks & Gantt Chart', '把想法排進時間裡。': 'Put your ideas on a timeline.', '日期、狀態與相依性直接連接心智圖；未排程任務仍保留在清單。': 'Dates, status, and dependencies stay linked to the mind map. Unscheduled tasks remain in the list.', '任務篩選': 'Filter Tasks', '全部任務': 'All Tasks', '依相依關係排程': 'Schedule by Dependencies', '-任務時程': '-Task Timeline', '匯出任務 PDF': 'Export Task PDF', '在主題的「任務狀態」設定待辦、日期，即可在這裡規劃。': 'Set a topic’s Task Status to To do and add dates to plan it here.', '開始': 'Start', '截止': 'Due', '天數': 'Days', '前置任務': 'Predecessors', '操作': 'Actions', '定位': 'Locate', '依真實日期計算的甘特圖': 'Gantt chart based on actual dates',
  'Page': '頁', 'Workspace': '工作空間', 'YOUR LOCAL WORKSPACE': '本機工作空間', 'OUTLINER': '大綱', 'TASK BOARD': '任務看板', 'Print Studio': '列印工作室',
  '邏輯圖': 'Logic Chart', '括號圖': 'Brace Map', '樹狀圖': 'Tree Diagram', '組織圖': 'Org Chart', '時間軸': 'Timeline', '魚骨圖': 'Fishbone Diagram', '矩陣圖': 'Matrix', '樹狀表格': 'Tree Table', '個節點': 'topics', '個已選取': 'selected', '清晰藍': 'Clear Blue', '森林綠': 'Forest Green', '深墨': 'Deep Ink',
  '摘要文字 {0}': 'Summary Text {0}', '刪除摘要 {0}': 'Delete Summary {0}', '移除附件 {0}': 'Remove Attachment {0}', '主題儲存失敗：{0}': 'Could not save theme: {0}', '範本儲存失敗：{0}': 'Could not save template: {0}',
  '目前版本 {0}。': 'Current version: {0}.', '本機儲存失敗：{0}。請立即儲存 .openmind 檔案。': 'Local save failed: {0}. Save an .openmind file now.', '檔案已儲存：{0}': 'File saved: {0}', '儲存失敗：{0}': 'Save failed: {0}', '已開啟 {0}': 'Opened {0}', '開啟失敗：{0}': 'Could not open: {0}', '{0}\n\n仍要匯出？': '{0}\n\nExport anyway?', '已匯出 {0}。': 'Exported {0}.', '匯出失敗：{0}': 'Export failed: {0}', '{0} {1}': '{0} {1}', '大綱：{0}': 'Outline: {0}', '新增 {0} 的子主題': 'Add a child topic to {0}', '無法開啟連結：{0}': 'Could not open link: {0}', '工作表 {0}': 'Sheet {0}', '{0} 個節點': '{0} topics', '填滿 {0}': 'Fill {0}', '刪除範本 {0}': 'Delete template {0}',
  '無法全螢幕：{0}': 'Could not enter full screen: {0}', '投影片 {0} 上移': 'Move slide {0} up', '投影片 {0} 下移': 'Move slide {0} down', '移除投影片 {0}': 'Remove slide {0}', '任務名稱 {0}': 'Task name {0}', '任務狀態 {0}': 'Task status {0}', '任務開始 {0}': 'Task start date {0}', '任務截止 {0}': 'Task due date {0}', '前置任務 {0}': 'Predecessors for task {0}', '定位任務 {0}': 'Locate task {0}', '移除任務 {0}': 'Remove task {0}'
};

// Keep untranslated English source labels in English and cover strings whose
// surrounding whitespace/newlines are normalized by t().
Object.assign(english, {
  '繁體中文': 'Traditional Chinese',
  '關係線': 'Relationships',
  '新增子主題': 'Add Child Topic',
  '輸出失敗：{0}': 'Export failed: {0}',
  '顯示更多結果（': 'Show more results (',
  '個工作表': 'sheets',
  '個結果': 'results',
  '副本': 'Copy',
  ' 頁 · 最小主題 ': ' page · smallest topic ',
  'Page': 'Page',
  'Workspace': 'Workspace',
  'YOUR LOCAL WORKSPACE': 'YOUR LOCAL WORKSPACE',
  'OUTLINER': 'OUTLINER',
  'TASK BOARD': 'TASK BOARD',
  'Print Studio': 'Print Studio',
  '{0} 仍要匯出？': '{0} Export anyway?',
  'Relationship': 'Relationship',
  'Add Child Topic': 'Add Child Topic',
  '⌘ + 滾輪': '⌘ + Scroll',
  'Export failed: {0}': 'Export failed: {0}',
  '操作時已切換文件，請重新選取。': 'The document changed during the operation. Select it again.',
  '顯示搜尋結果 {0}/{1}': 'Showing {0} of {1} results',
  '工作表單數 {0}': '{0} sheet',
  '工作表複數 {0}': '{0} sheets',
  '搜尋結果單數 {0}': '{0} result',
  '搜尋結果複數 {0}': '{0} results',
  '頁 · 最小主題': 'page · smallest topic',
  '副本 {0}': 'Copy of {0}',
  '-簡報': '-Presentation',
  '自動更新僅適用於正式簽署的 macOS 版本。': 'Automatic updates are only available in officially signed macOS releases.',
  '此版本尚未設定更新來源。': 'No update source is configured for this build.',
  '此版本尚未設定有效的 GitHub 更新來源。': 'No valid GitHub update source is configured for this build.',
  '正在檢查更新…': 'Checking for updates…',
  '正在下載更新…': 'Downloading update…',
  '正在下載 {0}…': 'Downloading {0}…',
  '目前已是最新版本（{0}）。': 'Already up to date: {0}.',
  'OpenMind {0} 已下載完成。': 'OpenMind {0} has finished downloading.',
  '正在重新啟動並安裝更新…': 'Restarting and installing the update…',
  '更新失敗，請檢查網路連線後再試一次。': 'The update failed. Check your network connection and try again.',
  '無法初始化更新服務。': 'Could not initialize the update service.'
});

Object.assign(english, {
  '不支援的紙張尺寸。': 'Unsupported paper size.',
  '紙張、邊界、重疊或最低字級超出可用範圍。': 'Paper size, margins, overlap, or minimum font size is outside the supported range.',
  '可列印範圍太小，請增加紙張或減少邊界。': 'The printable area is too small. Increase the paper size or reduce the margins.',
  '列印超過 500 頁安全上限，請選取分支。': 'Printing exceeds the 500-page safety limit. Select a branch.',
  '選取分支': 'Selected Branch',
  '完整心智圖': 'Full Mind Map',
  '中心主題': 'Central Topic',
  '較大的主要分支已自動分頁；淡色節點為重複脈絡，不會遺失或修改原始節點。': 'Large main branches were paginated automatically. Faded topics repeat context; the source map remains unchanged.',
  '跨頁分支的外框只在完整包含範圍的頁面顯示；原始外框資料不會變更。': 'Branch boundaries appear only on pages containing the full boundary. The source boundary is unchanged.',
  '個別節點或祖先路徑超過單頁範圍，該分支已改用可讀重排，維持最低主題字級。': 'A topic or ancestor path exceeds one page, so this branch uses readable reflow to preserve the minimum topic size.',
  '重疊區域過大。': 'The poster overlap is too large.',
  '海報超過 500 頁，請改用可讀分頁或選取分支。': 'The poster exceeds 500 pages. Use readable pagination or select a branch.',
  '拼接：第 {0} 列 / 第 {1} 欄': 'Poster tile: row {0} / column {1}',
  '海報 {0} 列 × {1} 欄，由左至右、由上至下排列；相鄰頁重疊 {2} mm。虛線對齊接合，邊緣節點可能刻意跨頁。': 'Poster: {0} rows × {1} columns, arranged left-to-right and top-to-bottom, with {2} mm overlap. Align dashed guides; edge topics may intentionally cross pages.',
  '可讀／大綱分頁重排階層；外框不繪製，關係以頁面提示與關係索引保留。': 'Readable and outline pages reflow the hierarchy. Boundaries are omitted; relationships remain in page references and the index.',
  '{0} 個節點；目前最小主題文字約 {1} pt，低於設定的 {2} pt。建議改用可讀分頁、較大紙張或主要分支自動分頁。': '{0} topics; the smallest topic text is about {1} pt, below the {2} pt setting. Try readable pagination, larger paper, or main-branch pagination.',
  '目前共 {0} 頁，建議選取分支以減少紙張。': '{0} pages. Select a branch to reduce paper use.',
  '跨頁關係 {0} {1} 第 {2} 頁 · {3} · {4}': 'Cross-page relation {0} {1} page {2} · {3} · {4}',
  '另 {0} 項關係，詳見索引第 {1} 頁': '{0} more relationships; see the index on page {1}',
  '完整關係索引：第 {0} 頁': 'Full relationship index: page {0}',
  '頁 · 最小主題': 'page · smallest topic',
  '列印超過 500 頁安全上限，請選取較小分支。': 'Printing exceeds the 500-page safety limit. Select a smaller branch.',
  '紙張無法容納目前字級與圖片，請增加紙張或降低最低字級。': 'The paper cannot fit the current font size and images. Use larger paper or lower the minimum font size.',
  '分支分頁超過 500 頁，請選取較小分支。': 'Branch pagination exceeds 500 pages. Select a smaller branch.',
  '分支 {0}（可讀重排）': 'Branch {0} (readable reflow)',
  '分支頁 {0} · {1}/{2}（淡色為重複脈絡）': 'Branch {0} · {1}/{2} (faded topics repeat context)',
  '脈絡：{0}': 'Context: {0}',
  '未命名關係': 'Unnamed relationship',
  '來源：第 {0} 頁 · {1}': 'From page {0} · {1}',
  '指向': 'Points to',
  '連結': 'Links to',
  '{0}：第 {1} 頁 · {2}': '{0}: page {1} · {2}',
  '摘要範圍': 'Summary scope',
  '範圍：第 {0} 頁': 'Scope: page {0}',
  '第 {0} 頁 · {1}': 'Page {0} · {1}',
  '接續前頁': 'Continued from previous page',
  '分支續頁': 'Branch continued on next page',
  '含跨頁關係索引超過 500 頁，請縮小列印範圍。': 'The relationship index exceeds 500 pages. Reduce the print scope.',
  '跨頁關係索引 {0}': 'Cross-page Relationship Index {0}',
  '{0}（續）': '{0} (continued)',
  '投影片 {0} · {1}': 'Slide {0} · {1}',
  '簡報保留整張分支，最小文字約 {0} pt；大型分支可另選較小主題作為投影片。': 'Slides preserve the full branch; the smallest text is about {0} pt. For large maps, choose smaller topics as slides.',
  '未排程': 'Unscheduled',
  '沒有可匯出的任務。': 'There are no tasks to export.',
  '任務 PDF 超過 500 頁，請縮小篩選範圍。': 'The task PDF exceeds 500 pages. Narrow the task filter.',
  '任務時程 {0}/{1}': 'Task timeline {0}/{1}',
  '個別任務名稱過長，最小文字約 {0} pt；可在主題中分段或改用大綱列印。': 'Some task names are long; the smallest text is about {0} pt. Shorten topic names or use outline printing.',
  'OpenMind 列印': 'OpenMind Print',
  '已輸出 PDF：{0}': 'PDF exported: {0}',
  '已送出列印工作。': 'Print job submitted.',
  '列印文件': 'Print document',
  '已開啟瀏覽器列印；可選擇「儲存為 PDF」。請關閉瀏覽器頁首頁尾，並保留預覽紙張設定。': 'Browser print is open. Choose “Save as PDF”; disable browser headers and footers and keep the preview paper settings.'
});

const chinese: Record<string, string> = {
  'Language': '語言', 'My Topics': '我的主題', 'Hierarchy & Summary': '階層與摘要', 'Insert Parent Topic': '插入上層主題', 'Create Summary from Selection': '建立選取摘要', 'Remove': '移除', 'Link to Topic': '連結至主題', 'Choose a topic in this document': '選擇文件內的主題',
  'More Text & Line Styles': '更多文字與線條樣式', 'Font': '字型', 'Text Font': '文字字型', 'Alignment': '對齊', 'Text Alignment': '文字對齊', 'Left': '靠左', 'Center': '置中', 'Right': '靠右', 'Fill Opacity': '填色透明度', 'Border Width': '外框粗細', 'Relationship Lines': '連接線', 'Line Style': '連接線樣式', 'Curved': '曲線', 'Elbow': '折線', 'Straight': '直線', 'Horizontal Spacing': '水平間距', 'Vertical Spacing': '垂直間距', 'Dashed Boundary': '虛線外框', 'Copy Style': '複製樣式', 'Paste Style': '貼上樣式', 'Reset Style': '重設樣式',
  'Images, Equations & Attachments': '貼圖、公式與附件', 'Image': '貼圖', 'Topic Image': '節點貼圖', 'No Image': '無貼圖', 'Math Formula (TeX / AMS)': '數學公式（TeX／AMS）', 'Topic Formula': '節點公式', 'Add Attachment (2 MB each)': '加入附件（每檔 2 MB）', 'Themes & Templates': '主題與範本', 'Apply Theme': '套用主題', 'Choose a Theme': '選擇主題', 'Custom Theme Name': '自訂主題名稱', 'Save Current Style as Theme': '保存目前樣式為主題', 'Template Name': '範本名稱', 'My Templates': '我的範本', 'Save Document as Template': '保存文件為範本',
  'Loading local documents…': '正在讀取本機文件…', 'Ready to save': '準備儲存', 'Presentation Mode': '簡報模式', 'Print Studio': '列印工作室', 'Software Update': '軟體更新', 'Quick Guide': '操作指南', 'Create a Mind Map': '建立心智圖', 'Edit Topic': '編輯主題', 'Saving…': '正在儲存…', 'Saved on this device': '已儲存於此裝置', 'New Topic': '新主題', 'Floating Topic': '自由主題', 'Search mind map': '搜尋心智圖', 'Untitled Mind Map': '未命名心智圖', 'Stored locally only': '僅儲存於本機', 'Open File': '開啟檔案', 'Save File': '儲存檔案', 'Check for Updates': '檢查更新', 'Update': '更新', 'Print & PDF': '列印與 PDF', 'New Mind Map': '新增心智圖', 'Workspace': '工作空間', 'Current Map': '目前心智圖', 'Recent Files': '最近文件', 'Sheets': '工作表', 'Add Sheet': '新增工作表', 'Mind Map': '心智圖', 'Outline': '大綱', 'Tasks': '任務', 'Presentation': '簡報', 'Undo': '復原', 'Redo': '重做', 'Child Topic': '子主題', 'Add Sibling Topic': '新增同層主題', 'Copy Branch': '複製分支', 'Focus Branch': '聚焦分支', 'Export': '匯出', 'Text & Hierarchy': '文字與階層', 'Topic': '主題', 'Content': '內容', 'Structure': '結構', 'Map Structure': '圖表結構', 'Shape': '形狀', 'Rounded Rectangle': '圓角矩形', 'Rectangle': '矩形', 'Pill': '膠囊', 'Text & Appearance': '文字與外觀', 'Text Size': '文字大小', 'Bold': '粗體', 'Italic': '斜體', 'Text Color': '文字顏色', 'Fill Color': '填滿顏色', 'Border Color': '外框顏色', 'Notes & Labels': '註記與標籤', 'Topic Notes': '節點備註', 'Link': '連結', 'Topic Link': '節點連結', 'Open Link': '開啟連結', 'Marker': '標記', 'Topic Marker': '節點標記', 'No Marker': '無標記', 'Status': '狀態', 'Task Status': '任務狀態', 'Not a Task': '不設為任務', 'In Progress': '進行中', 'Completed': '已完成', 'Start Date': '開始日期', 'Due Date': '截止日期', 'Branch Actions': '分支操作', 'Expand Branch': '展開分支', 'Collapse Branch': '收合分支', 'Move Up': '上移', 'Move Down': '下移', 'Highlight Branch': '重點分支', 'Branch Boundary': '分支外框', 'Delete Topic': '刪除節點', 'Sheets & Topics': '工作表與主題', 'Sheet Name': '工作表名稱', 'Duplicate Sheet': '複製工作表', 'Delete Sheet': '刪除工作表', 'Canvas Background': '畫布背景',
  'Cancel Editing': '取消編輯', 'Edit Topic Text': '編輯主題文字', 'Finish Editing': '完成編輯', 'What would you like to explore today?': '今天，想展開什麼？', 'Blank Mind Map': '空白心智圖', 'Start with one idea': '從一個想法開始', 'Close Guide': '關閉指南', 'F2 / Double-click': 'F2 / 雙擊', 'Edit Text': '編輯文字', 'Undo / Redo': '復原／重做', 'Save / Save As': '儲存／另存新檔', 'Print / Search': '列印／搜尋', 'Arrow Keys': '方向鍵', 'Branch Preview': '分支預覽', 'Close Branch Preview': '關閉分支預覽', 'Expand This Branch': '展開此分支', 'Local Workspace': '本機工作空間', 'Mind Map Canvas': '心智圖畫布', 'Select Tool': '選取工具', 'Pan Tool': '平移工具', 'Marquee Select Tool': '框選工具', 'Zoom Out': '縮小', 'Zoom In': '放大', 'Return to Center': '返回中央',
  'Back to Editing': '返回編輯', 'Slide Order': '投影片順序', 'Full Screen': '全螢幕', 'Exporting…': '正在輸出…', 'Export Presentation PDF': '匯出簡報 PDF', 'Add Topic': '加入主題', 'Add Slide': '加入投影片', 'Previous Slide': '上一張投影片', 'Pause': '暫停播放', 'Auto-play': '自動播放', 'Next Slide': '下一張投影片', 'Previous Page': '上一頁', 'Next Page': '下一頁', 'Zoom Preview Out': '預覽縮小', 'Zoom Preview In': '預覽放大', 'Fit to Window': '適合視窗', 'Relationship Index': '關係索引', 'Poster Layout Preview': '海報排列預覽',
  'Fit on One Page': '單頁完整', 'Readable Pagination': '可讀分頁', 'Poster Tiling': '海報拼接', 'Main-Branch Pagination': '主要分支分頁', 'Selected Branch': '選取分支', 'Outline Print': '大綱列印', 'Print Settings': '列印設定', 'Print Strategy': '列印策略', 'Paper & Layout': '紙張與版面', 'Paper Size': '紙張尺寸', 'Custom': '自訂', 'Orientation': '方向', 'Landscape': '橫向', 'Portrait': '直向', 'Header': '頁首', 'Footer': '頁尾', 'Show Page Numbers': '顯示頁碼', 'Print': '列印', 'Export PDF': '輸出 PDF', 'Focused Preview': '專注預覽',
  'Tasks & Gantt Chart': '任務與甘特圖', 'Filter Tasks': '任務篩選', 'All Tasks': '全部任務', 'Schedule by Dependencies': '依相依關係排程', 'Export Task PDF': '匯出任務 PDF', 'Start': '開始', 'Due': '截止', 'Days': '天數', 'Predecessors': '前置任務', 'Actions': '操作', 'Locate': '定位', 'Page': '頁', 'YOUR LOCAL WORKSPACE': '本機工作空間', 'OUTLINER': '大綱', 'TASK BOARD': '任務看板',
  'Logic Chart': '邏輯圖', 'Brace Map': '括號圖', 'Tree Diagram': '樹狀圖', 'Org Chart': '組織圖', 'Timeline': '時間軸', 'Fishbone Diagram': '魚骨圖', 'Matrix': '矩陣圖', 'Tree Table': '樹狀表格', 'topics': '個節點', 'selected': '已選取', 'Clear Blue': '清晰藍', 'Forest Green': '森林綠', 'Deep Ink': '深墨',
  'Summary Text {0}': '摘要文字 {0}', 'Delete Summary {0}': '刪除摘要 {0}', 'Remove Attachment {0}': '移除附件 {0}', 'Could not save theme: {0}': '主題儲存失敗：{0}', 'Could not save template: {0}': '範本儲存失敗：{0}', 'Current version: {0}.': '目前版本 {0}。', 'Local save failed: {0}. Save an .openmind file now.': '本機儲存失敗：{0}。請立即儲存 .openmind 檔案。', 'File saved: {0}': '檔案已儲存：{0}', 'Save failed: {0}': '儲存失敗：{0}', 'Opened {0}': '已開啟 {0}', 'Could not open: {0}': '開啟失敗：{0}', '{0}\n\nExport anyway?': '{0}\n\n仍要匯出？', 'Exported {0}.': '已匯出 {0}。', 'Export failed: {0}': '匯出失敗：{0}', 'Outline: {0}': '大綱：{0}', 'Add a child topic to {0}': '新增 {0} 的子主題', 'Could not open link: {0}': '無法開啟連結：{0}', 'Sheet {0}': '工作表 {0}', '{0} topics': '{0} 個節點', 'Fill {0}': '填滿 {0}', 'Delete template {0}': '刪除範本 {0}', 'Could not enter full screen: {0}': '無法全螢幕：{0}', 'Move slide {0} up': '投影片 {0} 上移', 'Move slide {0} down': '投影片 {0} 下移', 'Remove slide {0}': '移除投影片 {0}', 'Task name {0}': '任務名稱 {0}', 'Task status {0}': '任務狀態 {0}', 'Task start date {0}': '任務開始 {0}', 'Task due date {0}': '任務截止 {0}', 'Predecessors for task {0}': '前置任務 {0}', 'Locate task {0}': '定位任務 {0}', 'Remove task {0}': '移除任務 {0}'
};

Object.assign(chinese, {
  'Traditional Chinese': '繁體中文',
  'Relationships': '關係線',
  'Show more results (': '顯示更多結果（',
  'sheets': '個工作表',
  'results': '個結果',
  'Copy': '副本',
  'Relationship': '關係線',
  'Add Child Topic': '新增子主題',
  '⌘ + Scroll': '⌘ + 滾輪',
  'Export failed: {0}': '輸出失敗：{0}',
  'The document changed during the operation. Select it again.': '操作時已切換文件，請重新選取。',
  'Showing {0} of {1} results': '顯示 {0} 筆，共 {1} 筆搜尋結果',
  '{0} sheet': '{0} 個工作表',
  '{0} sheets': '{0} 個工作表',
  '{0} result': '{0} 個結果',
  '{0} results': '{0} 個結果',
  'page · smallest topic': '頁 · 最小主題',
  'Copy of {0}': '{0} 副本',
  '-Presentation': '-簡報',
  'Automatic updates are only available in officially signed macOS releases.': '自動更新僅適用於正式簽署的 macOS 版本。',
  'No update source is configured for this build.': '此版本尚未設定更新來源。',
  'No valid GitHub update source is configured for this build.': '此版本尚未設定有效的 GitHub 更新來源。',
  'Checking for updates…': '正在檢查更新…',
  'Downloading update…': '正在下載更新…',
  'Downloading {0}…': '正在下載 {0}…',
  'Already up to date: {0}.': '目前已是最新版本（{0}）。',
  'OpenMind {0} has finished downloading.': 'OpenMind {0} 已下載完成。',
  'Restarting and installing the update…': '正在重新啟動並安裝更新…',
  'The update failed. Check your network connection and try again.': '更新失敗，請檢查網路連線後再試一次。',
  'Could not initialize the update service.': '無法初始化更新服務。'
});

Object.assign(chinese, {
  'Unsupported paper size.': '不支援的紙張尺寸。',
  'Paper size, margins, overlap, or minimum font size is outside the supported range.': '紙張、邊界、重疊或最低字級超出可用範圍。',
  'The printable area is too small. Increase the paper size or reduce the margins.': '可列印範圍太小，請增加紙張或減少邊界。',
  'Printing exceeds the 500-page safety limit. Select a branch.': '列印超過 500 頁安全上限，請選取分支。',
  'Full Mind Map': '完整心智圖',
  'Central Topic': '中心主題',
  'Large main branches were paginated automatically. Faded topics repeat context; the source map remains unchanged.': '較大的主要分支已自動分頁；淡色節點為重複脈絡，不會遺失或修改原始節點。',
  'Branch boundaries appear only on pages containing the full boundary. The source boundary is unchanged.': '跨頁分支的外框只在完整包含範圍的頁面顯示；原始外框資料不會變更。',
  'A topic or ancestor path exceeds one page, so this branch uses readable reflow to preserve the minimum topic size.': '個別節點或祖先路徑超過單頁範圍，該分支已改用可讀重排，維持最低主題字級。',
  'The poster overlap is too large.': '重疊區域過大。',
  'The poster exceeds 500 pages. Use readable pagination or select a branch.': '海報超過 500 頁，請改用可讀分頁或選取分支。',
  'Poster tile: row {0} / column {1}': '拼接：第 {0} 列 / 第 {1} 欄',
  'Poster: {0} rows × {1} columns, arranged left-to-right and top-to-bottom, with {2} mm overlap. Align dashed guides; edge topics may intentionally cross pages.': '海報 {0} 列 × {1} 欄，由左至右、由上至下排列；相鄰頁重疊 {2} mm。虛線對齊接合，邊緣節點可能刻意跨頁。',
  'Readable and outline pages reflow the hierarchy. Boundaries are omitted; relationships remain in page references and the index.': '可讀／大綱分頁重排階層；外框不繪製，關係以頁面提示與關係索引保留。',
  '{0} topics; the smallest topic text is about {1} pt, below the {2} pt setting. Try readable pagination, larger paper, or main-branch pagination.': '{0} 個節點；目前最小主題文字約 {1} pt，低於設定的 {2} pt。建議改用可讀分頁、較大紙張或主要分支自動分頁。',
  '{0} pages. Select a branch to reduce paper use.': '目前共 {0} 頁，建議選取分支以減少紙張。',
  'Cross-page relation {0} {1} page {2} · {3} · {4}': '跨頁關係 {0} {1} 第 {2} 頁 · {3} · {4}',
  '{0} more relationships; see the index on page {1}': '另 {0} 項關係，詳見索引第 {1} 頁',
  'Full relationship index: page {0}': '完整關係索引：第 {0} 頁',
  'page · smallest topic': '頁 · 最小主題',
  'Printing exceeds the 500-page safety limit. Select a smaller branch.': '列印超過 500 頁安全上限，請選取較小分支。',
  'The paper cannot fit the current font size and images. Use larger paper or lower the minimum font size.': '紙張無法容納目前字級與圖片，請增加紙張或降低最低字級。',
  'Branch pagination exceeds 500 pages. Select a smaller branch.': '分支分頁超過 500 頁，請選取較小分支。',
  'Branch {0} (readable reflow)': '分支 {0}（可讀重排）',
  'Branch {0} · {1}/{2} (faded topics repeat context)': '分支頁 {0} · {1}/{2}（淡色為重複脈絡）',
  'Context: {0}': '脈絡：{0}',
  'Unnamed relationship': '未命名關係',
  'From page {0} · {1}': '來源：第 {0} 頁 · {1}',
  'Points to': '指向',
  'Links to': '連結',
  '{0}: page {1} · {2}': '{0}：第 {1} 頁 · {2}',
  'Summary scope': '摘要範圍',
  'Scope: page {0}': '範圍：第 {0} 頁',
  'Page {0} · {1}': '第 {0} 頁 · {1}',
  'Continued from previous page': '接續前頁',
  'Branch continued on next page': '分支續頁',
  'The relationship index exceeds 500 pages. Reduce the print scope.': '含跨頁關係索引超過 500 頁，請縮小列印範圍。',
  'Cross-page Relationship Index {0}': '跨頁關係索引 {0}',
  '{0} (continued)': '{0}（續）',
  'Slide {0} · {1}': '投影片 {0} · {1}',
  'Slides preserve the full branch; the smallest text is about {0} pt. For large maps, choose smaller topics as slides.': '簡報保留整張分支，最小文字約 {0} pt；大型分支可另選較小主題作為投影片。',
  'Unscheduled': '未排程',
  'There are no tasks to export.': '沒有可匯出的任務。',
  'The task PDF exceeds 500 pages. Narrow the task filter.': '任務 PDF 超過 500 頁，請縮小篩選範圍。',
  'Task timeline {0}/{1}': '任務時程 {0}/{1}',
  'Some task names are long; the smallest text is about {0} pt. Shorten topic names or use outline printing.': '個別任務名稱過長，最小文字約 {0} pt；可在主題中分段或改用大綱列印。',
  'OpenMind Print': 'OpenMind 列印',
  'PDF exported: {0}': '已輸出 PDF：{0}',
  'Print job submitted.': '已送出列印工作。',
  'Print document': '列印文件',
  'Browser print is open. Choose “Save as PDF”; disable browser headers and footers and keep the preview paper settings.': '已開啟瀏覽器列印；可選擇「儲存為 PDF」。請關閉瀏覽器頁首頁尾，並保留預覽紙張設定。'
});

let locale: Locale = readSavedLocale();
function readSavedLocale(): Locale {
  try {
    const saved = typeof localStorage === 'undefined' ? null : localStorage.getItem(storageKey);
    return saved === 'en' || saved === 'zh-TW' ? saved : 'zh-TW';
  } catch { return 'zh-TW'; }
}
export function getLocale(): Locale { return locale; }
export function setLocale(next: Locale): void {
  if (next === locale) return;
  locale = next;
  try { localStorage.setItem(storageKey, next); } catch { /* Storage may be disabled; the session locale still works. */ }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(eventName));
}

export function translateForLocale(source: string, selected: Locale): string {
  const normalized = source.replace(/\s+/g, ' ').trim();
  if (!normalized) return source;
  const translated = (selected === 'en' ? english : chinese)[normalized] ?? normalized;
  const leading = /^\s/.test(source) && !/^\s*\n/.test(source) ? ' ' : '';
  const trailing = /\s$/.test(source) && !/\n\s*$/.test(source) ? ' ' : '';
  return leading + translated + trailing;
}

export function t(source: string): string { return translateForLocale(source, locale); }

export function tTemplate(source: string, values: Array<string | number>): string {
  return t(source).replace(/\{(\d+)\}/g, (_match, index: string) => String(values[Number(index)] ?? ''));
}

export function useI18n(): {locale: Locale; setLocale: (value: Locale) => void} {
  const [current, setCurrent] = useState<Locale>(getLocale);
  useEffect(() => {
    const update = () => setCurrent(getLocale());
    window.addEventListener(eventName, update);
    return () => window.removeEventListener(eventName, update);
  }, []);
  return {locale: current, setLocale};
}
