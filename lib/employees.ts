import type { EmployeeId, OfficeEmployee } from '@/lib/types';

export const employees: OfficeEmployee[] = [
  { id: 'chief', name: 'Chief', role: 'AI Chief of Staff', shortRole: '統括・分解・委任', initials: 'CH', room: '中央司令室', description: '曖昧な依頼を分解し、専門AIへ委任して最終成果までまとめる統括役。', skills: ['タスク分解', '委任', '統合', '品質判断'], accent: '#7c9cff' },
  { id: 'research', name: 'Scout', role: 'Research Specialist', shortRole: '調査・一次情報探索', initials: 'SC', room: 'リサーチラボ', description: 'Web検索を使い、出典と推測を分けて調査する。見つからない事実は作らない。', skills: ['Web調査', '出典整理', '競合確認', '反証'], accent: '#52d7b7' },
  { id: 'writer', name: 'Draft', role: 'Writer / Editor', shortRole: '文章設計・編集', initials: 'DR', room: '編集部', description: '目的・読者・制約に合わせて、そのまま使える文章や構成へ落とし込む。', skills: ['記事', '企画書', 'コピー', '要約'], accent: '#f0a969' },
  { id: 'reviewer', name: 'Audit', role: 'Critical Reviewer', shortRole: '反証・品質監査', initials: 'AU', room: 'レビュー室', description: '前提・抜け・誤り・過剰断定を探し、必要な修正を優先度付きで返す。', skills: ['反証', 'リスク検出', '品質監査', '改善案'], accent: '#ff758f' },
  { id: 'analyst', name: 'Metric', role: 'Analyst', shortRole: '比較・数値・意思決定', initials: 'MT', room: '分析室', description: '条件を構造化し、比較・計算・トレードオフを明示して判断材料を作る。', skills: ['比較', '計算', '優先順位', '判断支援'], accent: '#c18bff' },
  { id: 'developer', name: 'Forge', role: 'Software Architect', shortRole: '設計・コードレビュー', initials: 'FG', room: '開発ラボ', description: '実装方針、コード、障害切り分けを担当。外部システム変更は自動実行しない。', skills: ['設計', '実装', 'レビュー', 'デバッグ'], accent: '#78b8ff' }
];

export const employeeMap = Object.fromEntries(employees.map((employee) => [employee.id, employee])) as Record<EmployeeId, OfficeEmployee>;
export const employeeIds = employees.map((employee) => employee.id) as [EmployeeId, ...EmployeeId[]];
