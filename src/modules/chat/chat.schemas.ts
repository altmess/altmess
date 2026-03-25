export const createChatScheme = {
	body: {
		type: "object",
		required: ["title"],
		properties: {
			title: { type: "string" },
			users: {
				type: "array",
				items: { type: "number" }
			}
		}
	},
	response: {
		200: {
			type: "object",
			properties: {
				id: { type: "number" },
				title: { type: "string" },
				users: {
					type: "array",
					items: { type: "object", properties: { id: { type: "number" } } }
				}
			}
		},
		400: {
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
