const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * It takes the data from the form, and sends it to the email address specified in the .env file.
 * @param req - The request object.
 * @param res - The response object.
 */
const contact = (req, res) => {
  const { name, email, message } = req.body;

  const emailData = {
    to: process.env.EMAIL_TO,
    from: email,
    subject: `Contact form - ${process.env.APP_NAME}`,
    text: `Email received from contact from \n Sender name: ${name} \n Sender email: ${email} \n Sender message: ${message}`,
    html: `
      <h4>Email received from contact form:</h4>
      <p>Sender name: ${name}</p>
      <p>Sender email: ${email}</p>
      <p>Sender messge: ${message}</p>
      <hr />
      <p>This email may contain sensetive information</p>
      <p>https://devtodev.com</p>
    `,
  };
  sgMail.send(emailData).then((sent) => {
    return res.json({
      success: true,
    });
  });
};

/**
 * It takes the author's email, the name, email, and message from the user, and sends an email to the
 * author and the admin
 * @param req - The request object.
 * @param res - The response object.
 */
const contactBlogAuthor = (req, res) => {
  const { authorEmail, name, email, message } = req.body;

  let maillist = [authorEmail, process.env.EMAIL_TO];

  const emailData = {
    to: maillist,
    from: email,
    subject: `Message from ${process.env.APP_NAME}`,
    text: `Email received from contact from \n Sender name: ${name} \n Sender email: ${email} \n Sender message: ${message}`,
    html: `
      <h4>Message received from</h4>
      <p>Name: ${name}</p>
      <p>Email: ${email}</p>
      <p>Messge: ${message}</p>
      <hr />
      <p>This email may contain sensetive information</p>
      <p>https://devtodev.com</p>
    `,
  };
  sgMail.send(emailData).then((sent) => {
    return res.json({
      success: true,
    });
  });
};

/* Exporting the functions contact and contactBlogAuthor. */
module.exports = {
  contact,
  contactBlogAuthor,
};
