-------

name: Olimpo Sales Management App
description: Sales management excel-like app (no formulas or calculations), just like excel but simpler.

---

---

Tech Stack:

- PWA
- React + TypeScript
- React Query (Tanstack), Tanstack Table
- Nextjs
- CSS3
- Prisma
- PostgreSQL

---

The app has only one user.

- Initially the app will show a login page with username/password fields.
- the first time the user types username/password, since there will be no user created in db, it will ask for password confirmation, and then create the user. On the second and subsequent logins, the app just matches username/password and logs the user in.
- Once the user logs in, he will be shown a table containing the following columns:

- Date (date of the sale)
- Client Name (text, editable)
- Address (text, editable)
- Products (list of products, each product has name, dimension (the dimension is like description of product, for example: Ozempic 2.5mg, where Ozempic is the product name, and 2.5mg is the dimension), quantity and total price, which is quantity _ unit price). Unit price is only handled at backend and database level. Total price is always calculated from quantity _ unit price. Since all this data is related, each product cell will contain a sublist of products/dimensions/quantities/total. (text and numbers, editable... price shown recalculated on the fly)
- Delivery status (dropdown: "Not delivered" - gray/"Delivered" - yellow, editable)
- Payment Status (dropdown: "Not paid" - gray/"Paid" - green, editable)
- Comments (text, editable)

Additionally, there should be a filter input, which will search by name/address.
A button for adding new row (which will add a new row with current date, empty client name, empty address, empty products, empty delivery status, empty payment status, empty comments).
A button for deleting selected row.
A button for importing a csv file (csv file will have the following columns: Date, Client Name, Address, Product, Dimension, Quantity, Total Price, Delivery Status, Payment Status, Comments). Since this structure is different, we should be able to save it properly in db, and translate it back to the frontend in the expected format. Note that total price is present in the csv file, the unit price should be calculated from total price / quantity.

---

Styles

- Minimalistic but modern look
- Use light mode only
- Make it touch-friendly, since it will be used mostly on tablets
- Use some animations, for example, when adding a new row, use a smooth animation to add the row to the table
- Keep in mind that it is a sales app, so make it look professional

---

Frontend guidelines

- Use typescript
- Use react query for data fetching and state management
- Use tanstack table for table
- Use nextjs for routing
- Use prisma for database
- Use css3 for styling
- Create compact and highly reusable components (as many as necessary)
- Don't compare against string literals, use proper enums/types, for example, for delivery status and payment status

Backend guidelines

- Separate concerns
- Create services for each model
- Create controllers for each service
- Create routes for each controller
- Create a prisma schema for each model
- Use proper error handling
- Validate all inputs
- Use proper type safety
- Keep it clean and maintainable
