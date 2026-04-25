# SitePilot
curl -X POST http://localhost:5000/api/auth/login \
-H "Content-Type: application/json" \
-d '{
  "email": "simar@test.com",
  "password": "123456"
}'



curl -X POST http://localhost:5000/api/websites \
-H "Content-Type: application/json" \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWVjODZlZDViNTg1MWMxMDY5YjhiNDQiLCJ0ZW5hbnRJZCI6IjY5ZWM4NmVkNWI1ODUxYzEwNjliOGI0MyIsInJvbGUiOiJvd25lciIsImlhdCI6MTc3NzEwOTc2NiwiZXhwIjoxNzc3NzE0NTY2fQ.2CS8nmqHYKDrOg86z-41gxeag81pV9lcPzWOecTRFns" \
-d '{
  "name": "My First Website"
}'
curl -X GET http://localhost:5000/api/websites \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWVjODZlZDViNTg1MWMxMDY5YjhiNDQiLCJ0ZW5hbnRJZCI6IjY5ZWM4NmVkNWI1ODUxYzEwNjliOGI0MyIsInJvbGUiOiJvd25lciIsImlhdCI6MTc3NzEwOTc2NiwiZXhwIjoxNzc3NzE0NTY2fQ.2CS8nmqHYKDrOg86z-41gxeag81pV9lcPzWOecTRFns"



curl -X POST http://localhost:5000/api/users \
-H "Content-Type: application/json" \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWVjODZlZDViNTg1MWMxMDY5YjhiNDQiLCJ0ZW5hbnRJZCI6IjY5ZWM4NmVkNWI1ODUxYzEwNjliOGI0MyIsInJvbGUiOiJvd25lciIsImlhdCI6MTc3NzEwOTc2NiwiZXhwIjoxNzc3NzE0NTY2fQ.2CS8nmqHYKDrOg86z-41gxeag81pV9lcPzWOecTRFns
" \
-d '{
  "name": "Admin User",
  "email": "admin@test.com",
  "password": "123456",
  "role": "admin"
}'



curl -X POST http://localhost:5000/api/pages \
-H "Content-Type: application/json" \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWVjODZlZDViNTg1MWMxMDY5YjhiNDQiLCJ0ZW5hbnRJZCI6IjY5ZWM4NmVkNWI1ODUxYzEwNjliOGI0MyIsInJvbGUiOiJvd25lciIsImlhdCI6MTc3NzEwOTc2NiwiZXhwIjoxNzc3NzE0NTY2fQ.2CS8nmqHYKDrOg86z-41gxeag81pV9lcPzWOecTRFns" \
-d '{
  "title": "Home",
  "websiteId": "69ec8b689ac3824f0c3d7260",
  "isHomepage": true
}'



curl -X POST http://localhost:5000/api/ai/generate \
-H "Content-Type: application/json" \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWVjODZlZDViNTg1MWMxMDY5YjhiNDQiLCJ0ZW5hbnRJZCI6IjY5ZWM4NmVkNWI1ODUxYzEwNjliOGI0MyIsInJvbGUiOiJvd25lciIsImlhdCI6MTc3NzEwOTc2NiwiZXhwIjoxNzc3NzE0NTY2fQ.2CS8nmqHYKDrOg86z-41gxeag81pV9lcPzWOecTRFns" \
-d '{
  "pageId": "69ec9141af1be7bfc6f58178",
  "prompt": "Create a modern gym homepage with hero, services, and contact section"
}'