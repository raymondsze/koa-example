FROM node:5.9.0

WORKDIR /root
#copy the source to docker container
COPY src/ /root/src
WORKDIR /root/src/
RUN npm install
#run the npm script for the packages

EXPOSE 4080
CMD npm run start
