const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const contact = (req, res) => {
  const { name, email, message } = req.body

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
    `
  }
  sgMail.send(emailData).then((sent) => {
    return res.json({
      success: true
    })
  })
}

const contactBlogAuthor = (req, res) => {
  const { authorEmail, name, email, message } = req.body

  let maillist = [authorEmail, process.env.EMAIL_TO]

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
    `
  }
  sgMail.send(emailData).then((sent) => {
    return res.json({
      success: true
    })
  })
}

module.exports = {
  contact,
  contactBlogAuthor
}