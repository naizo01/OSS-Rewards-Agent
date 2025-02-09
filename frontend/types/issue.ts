export type Issue = {
  id: number; // グローバルID
  issueId: number; // リポジトリ内のIssue ID
  title: string;
  status: string;
  donations: number;
  repo: string;
  description: string;
}; 
