export const registerSchema = {
	body: {
		type: "object",
		required: ["username", "password"],
		properties: {
			token: { type: "string" },
			user: {
				type: "object",
				properties: {
					username: { type: "string", minLength: 3, maxLength: 30 },
					password: { type: "string", minLength: 6 },
					name: { type: "string", maxLength: 100 }
				}
			}
		}
	},
	response: {
		201: {
			type: "object",
			properties: {
				token: { type: "string" },
				user: {
					type: "object",
					properties: {
						id: { type: "number" },
						username: { type: "string" },
						name: { type: "string" },
						createdAt: { type: "string" }
					}
				}
			}
		},
		409: {
			type: "object",
			properties: {
				error: { type: "string" }
			}
		},
		500: {
			type: "object",
			properties: {
				error: { type: "string" }
			}
		}
	}
};

export const loginSchema = {
	body: {
		type: "object",
		required: ["username", "password"],
		properties: {
			username: { type: "string" },
			password: { type: "string" }
		}
	},
	response: {
		200: {
			type: "object",
			properties: {
				token: { type: "string" },
				user: {
					type: "object",
					properties: {
						id: { type: "number" },
						username: { type: "string" },
						name: { type: "string" }
					}
				}
			}
		},
		401: {
			type: "object",
			properties: {
				error: { type: "string" }
			}
		},
		500: {
			type: "object",
			properties: {
				error: { type: "string" }
			}
		}
	}
};
