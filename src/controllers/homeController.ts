import { Request, Response } from "express";
import { getRandomPhotos, getTitles } from "./recipesController";


export const renderHomePage =  async(req: Request, res: Response) => {
    const carouselRandomPhotos = await getRandomPhotos(3);
    const componentRandomPhotos = await getRandomPhotos(6);
    const recipeIds = componentRandomPhotos ? componentRandomPhotos.map(photo => photo.recipe_id) : [];
    const componentTitles = await getTitles(recipeIds);
    const titlesMap = componentTitles ? new Map(componentTitles.map(title => [title.recipe_id, title.description])) : new Map();
    const photosWithTitles = componentRandomPhotos ? componentRandomPhotos.map(photo => ({
      photo: photo.photo,
      recipe_id: photo.recipe_id,
      title: titlesMap.get(photo.recipe_id) || "Brak tytułu"
    })) : [];
   // console.log("🚀 componentPhotosUrl:", componentRandomPhotos);
   //console.log("🚀 carouselPhotosUrl:", carouselRandomPhotos);


    res.render("index", {carouselPhotosUrl: carouselRandomPhotos, photosWithTitles: photosWithTitles});
}


export const renderStaticPage = (page: string) => {
    return (req: Request, res: Response) => res.render(`pages/${page}`);
  };