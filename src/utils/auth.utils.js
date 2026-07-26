function normalizeLoginInput(email, password) {
  const trimmedEmail = (email || "").trim().toLowerCase();
  const trimmedPassword = (password || "").trim();

  if (!trimmedEmail || !trimmedPassword) {
    return {
      valid: false,
      error: "Please enter your email and password.",
      email: trimmedEmail,
      password: trimmedPassword,
    };
  }

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

  if (!isValidEmail) {
    return {
      valid: false,
      error: "Please enter a valid email address.",
      email: trimmedEmail,
      password: trimmedPassword,
    };
  }

  return {
    valid: true,
    error: null,
    email: trimmedEmail,
    password: trimmedPassword,
  };
}

export { normalizeLoginInput };
