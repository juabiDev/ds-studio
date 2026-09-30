// Browser event that lets any "Agendar" button pre-select a service in the booking wizard.
export const SELECT_SERVICE_EVENT = "booking:select-service";

export type SelectServiceEvent = CustomEvent<{ serviceId: string }>;
