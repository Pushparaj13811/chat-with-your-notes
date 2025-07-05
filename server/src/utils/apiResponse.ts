class ApiResponse {
    constructor(
        public statusCode: number,
        public message: string,
        public data: any = null
    ) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }

    toJSON() {
        return {
            success: this.statusCode >= 200 && this.statusCode < 300,
            message: this.message,
            data: this.data
        };
    }
}

export { ApiResponse };