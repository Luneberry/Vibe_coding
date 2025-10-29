export interface UserConfig {
  name: string;
  notion_key: string;
  notion_db: string;
  report_time: string; // "HH:mm" 형식
  bubbleColor?: string;
}

export interface ConfigValidation {
  isValid: boolean;
  errors: {
    name?: string;
    notion_key?: string;
    notion_db?: string;
    report_time?: string;
  };
}
