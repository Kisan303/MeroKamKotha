import { Layout } from "@/components/ui/layout";

export default function AboutPage() {
  return (
    <Layout>
      <div className="container mx-auto py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">About Mero KamKotha</h1>
            <p className="text-xl text-muted-foreground">
              A platform connecting people with rooms and job opportunities
            </p>
          </div>

          <div className="bg-card rounded-lg p-8 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">Developer Profile</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Name</h3>
                <p className="text-muted-foreground">Kisan Rai</p>
              </div>
              <div>
                <h3 className="font-medium">Role</h3>
                <p className="text-muted-foreground">Full Stack Software Developer</p>
              </div>
              <div>
                <h3 className="font-medium">Education</h3>
                <p className="text-muted-foreground">Lambton College Student</p>
              </div>
              <div>
                <h3 className="font-medium">Contact</h3>
                <a href="mailto:kisanrai939@gmail.com" className="text-primary hover:underline">
                  kisanrai939@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg p-8 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">Project Overview</h2>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Mero KamKotha is a dynamic social platform designed to help people find rooms and job opportunities.
                The platform provides an intuitive interface for users to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Post and discover room listings</li>
                <li>Share job opportunities</li>
                <li>Connect with property owners and employers</li>
                <li>Manage bookmarks and track interactions</li>
                <li>Engage in discussions through comments</li>
              </ul>
            </div>
          </div>

          <div className="bg-card rounded-lg p-8 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">Technologies Used</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="font-medium">React</p>
                <p className="text-sm text-muted-foreground">Frontend Framework</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="font-medium">TypeScript</p>
                <p className="text-sm text-muted-foreground">Programming Language</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="font-medium">Express</p>
                <p className="text-sm text-muted-foreground">Backend Framework</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="font-medium">PostgreSQL</p>
                <p className="text-sm text-muted-foreground">Database</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="font-medium">Drizzle ORM</p>
                <p className="text-sm text-muted-foreground">Database ORM</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="font-medium">Socket.IO</p>
                <p className="text-sm text-muted-foreground">Real-time Updates</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
