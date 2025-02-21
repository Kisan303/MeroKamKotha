import { Layout } from "@/components/ui/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Mail,
  Github,
  LinkedinIcon,
  Code2,
  Database,
  Server,
} from "lucide-react";

export default function AboutPage() {
  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-b from-primary/10 via-primary/5 to-background py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto text-center"
            >
              <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                About Mero KamKotha
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                A modern platform connecting people with rooms and job
                opportunities, built with cutting-edge technologies and user
                experience in mind.
              </p>
            </motion.div>
          </div>
          <div className="absolute inset-0 bg-grid-white/10 bg-[size:30px_30px] pointer-events-none" />
        </div>

        <div className="container mx-auto px-4 py-16 space-y-16">
          {/* Developer Profile Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 gap-8 items-center"
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Developer Profile</h2>
                <p className="text-muted-foreground">
                  Full Stack Software Developer & Lambton College Student
                </p>
              </div>

              <Card className="p-6 bg-gradient-to-br from-card to-muted/50">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-primary">Kisan Rai</h3>
                    <p className="text-sm text-muted-foreground">
                      Full Stack Software Developer
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      "I'm passionate about creating seamless user experiences
                      and solving real-world problems through technology."
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Mail className="h-4 w-4" />
                      <a href="mailto:kisanrai939@gmail.com">Email</a>
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Github className="h-4 w-4" />
                      <a
                        href="https://github.com/Kisan303"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Github
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <LinkedinIcon className="h-4 w-4" />
                      <a
                        href="https://www.linkedin.com/in/kisanrai/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        LinkedIn
                      </a>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            <div className="relative aspect-square rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <div className="absolute inset-2 rounded-full overflow-hidden bg-muted">
                <img
                  src="https://raw.githubusercontent.com/Kisan303/SocialLink/main/img/Profile2.0.jpg"
                  alt="Kisan Rai"
                  className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
          </motion.div>

          {/* Project Overview Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-8"
          >
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Project Overview</h2>
              <p className="text-muted-foreground">
                A comprehensive solution for housing and employment needs
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Code2 className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold">Modern Frontend</h3>
                  <p className="text-sm text-muted-foreground">
                    Built with React and TypeScript for a responsive and
                    type-safe user experience
                  </p>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5 hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Server className="h-6 w-6 text-purple-500" />
                  </div>
                  <h3 className="text-xl font-semibold">Robust Backend</h3>
                  <p className="text-sm text-muted-foreground">
                    Express server with real-time updates using Socket.IO
                  </p>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Database className="h-6 w-6 text-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold">Data Management</h3>
                  <p className="text-sm text-muted-foreground">
                    PostgreSQL with Drizzle ORM for efficient data handling
                  </p>
                </div>
              </Card>
            </div>
          </motion.div>

          {/* Technologies Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-8"
          >
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Technologies Used</h2>
              <p className="text-muted-foreground">
                Built with modern and scalable technologies
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { name: "React", desc: "Frontend Framework", color: "blue" },
                {
                  name: "TypeScript",
                  desc: "Programming Language",
                  color: "indigo",
                },
                { name: "Express", desc: "Backend Framework", color: "green" },
                { name: "PostgreSQL", desc: "Database", color: "cyan" },
                { name: "Drizzle ORM", desc: "Database ORM", color: "orange" },
                { name: "Socket.IO", desc: "Real-time Updates", color: "red" },
                { name: "TailwindCSS", desc: "Styling", color: "teal" },
                { name: "shadcn/ui", desc: "UI Components", color: "violet" },
              ].map((tech, i) => (
                <motion.div
                  key={tech.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                >
                  <Card
                    className={`p-4 bg-gradient-to-br from-${tech.color}-500/10 to-${tech.color}-500/5 hover:shadow-md transition-all hover:-translate-y-1`}
                  >
                    <h3 className="font-semibold">{tech.name}</h3>
                    <p className="text-sm text-muted-foreground">{tech.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}