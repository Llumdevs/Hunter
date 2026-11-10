export function loginErrorMessage(code?: string): string {
  switch (code) {
    case "anonymous_provider_disabled":
      return "El acceso de prueba aún no está habilitado. El responsable de Hunter debe activar Anonymous Sign-ins en Supabase.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Se han solicitado demasiados correos. Espera unos minutos antes de volver a intentarlo.";
    case "email_address_not_authorized":
    case "email_address_invalid":
      return "No se puede enviar el correo a esta dirección. Revisa el email; si es correcto, el responsable de Hunter debe habilitar los envíos a usuarios de prueba.";
    case "otp_expired":
    case "access_denied":
      return "El enlace ha caducado o ya se ha utilizado. Solicita uno nuevo.";
    case "callback_failed":
      return "No hemos podido completar el acceso. Solicita otro enlace y ábrelo en el mismo navegador donde lo pediste.";
    case "profile_failed":
      return "Has iniciado sesión, pero no hemos podido cargar tu perfil. Vuelve a intentarlo en unos instantes.";
    default:
      return "No hemos podido iniciar sesión. Revisa tu conexión e inténtalo de nuevo.";
  }
}
