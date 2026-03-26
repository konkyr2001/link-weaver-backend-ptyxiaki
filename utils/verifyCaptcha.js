const express = require("express");
const dotenv = require("dotenv").config();


async function verifyCaptcha(secretKey, recaptcha) {
  const params = new URLSearchParams({
    secret: secretKey,
    response: recaptcha,
  });
  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    body: params
  });
  const data = await response.json();
  return data;
}

module.exports = { verifyCaptcha };