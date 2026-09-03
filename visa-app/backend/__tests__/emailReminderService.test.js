const createEmailReminderService = require("../services/emailReminderService");

function createPool(handler) {
  return { query: jest.fn(handler) };
}

const reminderRow = {
  id: 1,
  user_id: 4,
  recipient_email: "cliente@example.com",
  reminder_type: "pending_document",
  entity_type: "documento",
  entity_id: "41",
  reminder_date: "2026-09-02",
  subject: "Recordatorio de documento pendiente",
  body: "Tienes un documento pendiente.",
  status: "dry_run",
  error: null,
  metadata: {},
  sent_at: "2026-09-02T10:00:00.000Z",
  created_at: "2026-09-02T10:00:00.000Z",
};

describe("email reminder service", () => {
  test("detecta documentos pendientes", async () => {
    const pool = createPool(async (sql) => {
      if (String(sql).includes("FROM documentos d")) {
        return {
          rows: [{
            document_id: 41,
            document_name: "Pasaporte",
            estado: "review",
            user_id: 4,
            user_name: "Cliente",
            recipient_email: "cliente@example.com",
          }],
        };
      }
      if (String(sql).includes("FROM tramite t")) return { rows: [] };
      return { rows: [] };
    });

    const service = createEmailReminderService(pool);
    const candidates = await service.listReminderCandidates();

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      reminder_type: "pending_document",
      entity_type: "documento",
      entity_id: "41",
      recipient_email: "cliente@example.com",
    });
  });

  test("detecta trámites en etapa de entrevista", async () => {
    const pool = createPool(async (sql) => {
      if (String(sql).includes("FROM documentos d")) return { rows: [] };
      if (String(sql).includes("FROM tramite t")) {
        return {
          rows: [{
            id_tramite: 21,
            etapa_actual: "Entrevista",
            user_id: 4,
            user_name: "Cliente",
            recipient_email: "cliente@example.com",
          }],
        };
      }
      return { rows: [] };
    });

    const service = createEmailReminderService(pool);
    const candidates = await service.listReminderCandidates();

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      reminder_type: "upcoming_interview",
      entity_type: "tramite",
      entity_id: "21",
    });
  });

  test("omite recordatorios duplicados del mismo día", async () => {
    const sendEmail = jest.fn();
    const pool = createPool(async (sql) => {
      if (String(sql).includes("FROM email_reminders")) return { rows: [reminderRow] };
      return { rows: [] };
    });
    const service = createEmailReminderService(pool, { sendEmail });

    const result = await service.sendReminder({
      user_id: 4,
      recipient_email: "cliente@example.com",
      reminder_type: "pending_document",
      entity_type: "documento",
      entity_id: "41",
      subject: "Recordatorio",
      body: "Contenido",
      metadata: {},
    }, { reminderDate: "2026-09-02" });

    expect(result).toMatchObject({ status: "skipped", reason: "duplicate" });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  test("usa modo dry-run por defecto y no requiere proveedor real en pruebas", async () => {
    const pool = createPool(async (sql, values) => {
      if (String(sql).includes("FROM email_reminders")) return { rows: [] };
      if (String(sql).includes("INSERT INTO email_reminders")) {
        return {
          rows: [{
            ...reminderRow,
            user_id: values[0],
            recipient_email: values[1],
            reminder_type: values[2],
            entity_type: values[3],
            entity_id: values[4],
            reminder_date: values[5],
            subject: values[6],
            body: values[7],
            status: values[8],
            error: values[9],
            metadata: JSON.parse(values[10]),
          }],
        };
      }
      return { rows: [] };
    });
    const service = createEmailReminderService(pool, { env: { EMAIL_REMINDERS_MODE: "dry_run" } });

    const result = await service.sendReminder({
      user_id: 4,
      recipient_email: "cliente@example.com",
      reminder_type: "pending_document",
      entity_type: "documento",
      entity_id: "41",
      subject: "Recordatorio",
      body: "Contenido",
      metadata: { documentName: "Pasaporte" },
    }, { reminderDate: "2026-09-02" });

    expect(result.status).toBe("dry_run");
    expect(result.reminder).toMatchObject({
      recipientEmail: "cliente@example.com",
      status: "dry_run",
    });
  });
});
