![](https://img.shields.io/badge/version-0.1-blue) 

# SIGMA - Citizen Management and Services

SIGMA is a citizen management system that centralizes and coordinates the different city services: health emergency systems, police, military, hospital care, etc, enabling coordination between departments and citizens.

Designed for use in GTA V _Roleplay_ environments.

## ⚒️  Usage and Deploy
### Components
This platform is based on:
- A [Next.js](https://nextjs.org/) React application as webpage frontend, based on Node JS.
- A [Fast API](https://fastapi.tiangolo.com/) application as backend and API REST, based on Python 3

And his functionallities are supported on:
- [Firebase: Authentication](https://firebase.google.com/docs/auth?hl=es-419)
- [Firebase: Cloud Firestore](https://firebase.google.com/docs/firestore?hl=es-419)

### How to deploy
In order to deploy your own installation of SIGMA, yon need to follow the following steps:


1. Create a Google Cloud Platform Firebase project from [Firebase console](https://console.firebase.google.com/)
2. Setup Firebase Authentication and Firestore by enabling the service.
3. Add a Web application on your Firebase Project
4. Download the service Account Credentials
5. Set the Service Account credentials on the backend and update the application configuration the frontend
6. Run the Backend  and the Frontend

## 🐛 Bug Report
Have you found a bug? Report it by [creating a new issue](../../issues/new?template=bug_report.md) using our bug report template.

## 🤷‍♀️ Credits
Created by [Paula "Latra" Gallucci](https://github.com/latra) with the special collaboration of "Raudive"

Designed originally for Real RP server

This project could not be possible without the previous work from:
- [Sebastián "Tiangolo" Ramirez](http://tiangolo.com/) - FastAPI creator and main manteiner


## 📜 License

This project has been built under [Attribution-NonCommercial-ShareAlike 4.0 International](./LICENSE) license. In summary:


- 🚫 **Non-Commercial Use Only**: This work can only be used for non-commercial purposes. Any commercial use requires explicit permission.
- ✍️ **Attribution Required**: You must give appropriate credit, provide a link to the license, and indicate if changes were made.
- 🔄 **Share-Alike Freedom**: You are free to adapt, remix, and redistribute the work for non-commercial purposes.
