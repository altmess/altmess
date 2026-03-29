const userResponseProperties = {
	id: { type: "number" },
	username: { type: "string" },
	name: { type: ["string", "null"] }
};

export const getUserByIdSchema = {
	params: {
		type: "object",
		required: ["id"],
		properties: {
			id: { type: "string" }
		}
	},
	response: {
		200: {
			type: "object",
			properties: userResponseProperties
		},
		404: {
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

export const getMeScheme = {
	response: {
		200: {
			type: "object",
			properties: userResponseProperties
		},
		404: {
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

export const deleteUserScheme = {
	response: {
		200: {
			type: "object",
			properties: {
				message: { type: "string" }
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

export const searchUsersSchema = {
	querystring: {
		type: "object",
		required: ["username"],
		properties: {
			username: { type: "string", minLength: 2, maxLength: 30 }
		}
	},
	response: {
		200: {
			type: "array",
			items: {
				type: "object",
				properties: userResponseProperties
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

export const updateUserScheme = {
	body: {
		type: "object",
		properties: {
			username: { type: "string", minLength: 3, maxLength: 30 },
			name: { type: "string", maxLength: 100 }
		}
	},
	response: {
		200: {
			type: "object",
			properties: userResponseProperties
		},
		404: {
			type: "object",
			properties: {
				error: { type: "string" }
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
