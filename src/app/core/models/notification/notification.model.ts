export type Notification = {
    id: number;
    message: string;
    user_id: number;
    created_at: Date;
    is_read: boolean;
}