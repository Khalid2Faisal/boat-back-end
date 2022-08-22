# Boat Server

![](https://res.cloudinary.com/khalid-faisal/image/upload/v1661171582/Personal/boat-home-page_l8ygre.png)

You can preview this site [here](https://boat-travel.vercel.app/). Back-End code [here](https://github.com/Khalid2Faisal/boat-back-end).

## Technical implementation details

- For the front end, I used React, NextJS, TailwindCss for styling, Typescript, Redux Toolkit for state management, axios for data fetching, and react-hook-forms for handling forms.

- For the back end, I used NodeJS, Express, sendgrid for sending emails, google auth for authentication, MongoDB as a database, express validator to validate requests data.

- I've used Redux Toolkit for state management, because I needed a central store for my data, so I can access it from any component. I had to deal with relatively complex state (posts, categories, tags, users, authentication, navigation, ...), so it would've been difficult and messy if I didn't use Redux.

- With the use of Redux Toolkit and Axios features, I handled the loading state and showed a skeleton component while fetching data from the server.

- I used mongoose library to make the schemas and models, of the database. It provides a higher level of abstraction over the regular MongoDB driver.

- For server-side validation, I made middleware functions to run validations and handle validation errors using express-validator, because one can never rely on the user’s input alone, as these inputs sometimes contain malicious data.

## Business Details

- Boat_Travel is a unique free online travel diary for travelers across the world, where each traveler share his/her experience.

- Each user can create a free account and start right away, writing his/her first post through reach text editor. The user can choose a category, a tag, create a tag, choose a featured image for his post, and add a title for it.

- First on the landing page, there are the featured posts, then the latest posts, and then posts by category. The user can click on the post image or title and go to the post content page, the user also can browse posts by tag in the tags page, or by category in the categories page.

- There is a dashboard for the admin to have full control over the blog. The admin can create posts, update posts, delete posts, create users, delete users, and more other things.

- Every user has a profile with his/her photo, name, email, and other information. The user can update his/her profile at any time.

- In case the user has forgotten the password, he/she has the ability to reset the password again.

## How to use

Execute [`npm start`]  to bootstrap the app:
