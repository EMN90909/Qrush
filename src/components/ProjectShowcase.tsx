"use client";

import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  title: string;
  description: string;
  link: string;
  image?: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ title, description, link, image }) => (
  <Card className="flex flex-col h-full rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-none">
    {image && (
      <div className="relative h-40 w-full overflow-hidden rounded-t-xl bg-muted">
        <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover" />
      </div>
    )}
    <CardHeader className="flex-grow pb-2">
      <CardTitle className="text-xl font-semibold text-foreground">{title}</CardTitle>
      <CardDescription className="text-muted-foreground">{description}</CardDescription>
    </CardHeader>
    <CardContent className="pt-4">
      <Button asChild className="w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
        <a href={link} target="_blank" rel="noopener noreferrer">
          Visit Project
        </a>
      </Button>
    </CardContent>
  </Card>
);

const projects = [
  {
    title: "Learnzac",
    description: "Learn about STEM for free with learnzac.",
    link: "https://learnzac.onrender.com",
    image: "https://via.placeholder.com/400x200.png?text=Learnzac",
  },
  {
    title: "Emn-hub",
    description: "Get whatever you need in one app.",
    link: "https://emn-hub.onrender.com",
    image: "https://via.placeholder.com/400x200.png?text=Emn-hub",
  },
  {
    title: "Image Editor",
    description: "Edit your photos with powerful tools and stunning filters.",
    link: "https://emn.render.com/3",
    image: "https://via.placeholder.com/400x200.png?text=Image+Editor",
  },
  {
    title: "Task Manager",
    description: "Organize your tasks and boost your productivity with our smart manager.",
    link: "https://emn.render.com/4",
    image: "https://via.placeholder.com/400x200.png?text=Task+Manager",
  },
];

const ProjectShowcase: React.FC = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <section className="py-12 bg-secondary text-foreground">
      <div className="container mx-auto px-4 md:px-8">
        <h3 className="text-3xl font-bold text-center mb-8">More Projects by Emtra</h3>
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -ml-4">
              {projects.map((project, index) => (
                <div key={index} className="flex-none w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 pl-4">
                  <ProjectCard {...project} />
                </div>
              ))}
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            className="absolute top-1/2 -translate-y-1/2 left-0 -ml-4 z-10 rounded-full shadow-md bg-background hover:bg-accent hover:text-accent-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            className="absolute top-1/2 -translate-y-1/2 right-0 -mr-4 z-10 rounded-full shadow-md bg-background hover:bg-accent hover:text-accent-foreground"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ProjectShowcase;