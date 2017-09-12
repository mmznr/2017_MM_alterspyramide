setwd("L://STAT//08_DS//01_Projekte//Visualisierungen//2017_MM_alterspyramide//data")

library(tidyr)
library(plyr)



df <- read.table("aba.csv", sep=",", header=TRUE,fileEncoding="UTF-8")
View(df)
df$heimat_sex = paste(df$heimat, df$sex, sep="_")
df$heimat <- NULL
df$sex <- NULL

ndf <- spread(df,heimat_sex,anzahl)


write.csv(ndf, file = "aba_reshape.csv",row.names=FALSE,fileEncoding="UTF-8")