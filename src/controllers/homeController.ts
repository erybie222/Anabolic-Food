import { Request, Response } from "express";
import { getRandomPhotosRecipeIdTitle, getTitles } from "./recipesController";


export const renderHomePage =  async(req: Request, res: Response) => {
    const carouselRandomPhotos = await getRandomPhotosRecipeIdTitle(3);
    const componentRandomPhotos = await getRandomPhotosRecipeIdTitle(6);
   // console.log("🚀 componentPhotosUrl:", componentRandomPhotos);
   //console.log("🚀 carouselPhotosUrl:", carouselRandomPhotos);


    res.render("index", {carouselPhotos: carouselRandomPhotos, ComponentPhotos: componentRandomPhotos});
}


export const renderStaticPage = (page: string) => {
    return (req: Request, res: Response) => res.render(`pages/${page}`);
  };