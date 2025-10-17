export = User;
declare class User {
    /**
     * Create a new user
     */
    static create(userData: any): Promise<User>;
    /**
     * Find user by email
     */
    static findByEmail(email: any): Promise<User | null>;
    /**
     * Find user by ID
     */
    static findById(id: any): Promise<User | null>;
    /**
     * Find all users with optional filters
     */
    static findAll(options?: {}): Promise<{
        users: User[];
        total: number;
    }>;
    /**
     * Get user statistics
     */
    static getStats(): Promise<any[]>;
    constructor(userData?: {});
    id: any;
    email: any;
    name: any;
    passwordhash: any;
    role: any;
    permissions: any;
    status: any;
    lastlogin: any;
    createdat: any;
    updatedat: any;
    /**
     * Update user
     */
    update(updateData: any): Promise<this>;
    /**
     * Update password
     */
    updatePassword(newPassword: any): Promise<this>;
    /**
     * Update last login timestamp
     */
    updateLastLogin(): Promise<this>;
    /**
     * Compare password
     */
    comparePassword(password: any): Promise<any>;
    /**
     * Delete user (soft delete by setting status to inactive)
     */
    delete(): Promise<this>;
    /**
     * Convert to JSON (exclude sensitive data)
     */
    toJSON(): Omit<this, "passwordhash" | "update" | "updatePassword" | "updateLastLogin" | "comparePassword" | "delete" | "toJSON">;
}
//# sourceMappingURL=User.d.ts.map