///////////////////////////////////////////////////////////////////////////////
// ARGUMENTS
///////////////////////////////////////////////////////////////////////////////

var target = Argument("target", "Default");
var configuration = Argument("configuration", "Debug");
var nuspecFiles = GetFiles("./**/*.nuspec");
var artifacts = "./artifacts";

///////////////////////////////////////////////////////////////////////////////
// SETUP / TEARDOWN
///////////////////////////////////////////////////////////////////////////////

Setup(ctx =>
{
   // Executed BEFORE the first task.
   Information("Running tasks...");
});

Teardown(ctx =>
{
   // Executed AFTER the last task.
   Information("Finished running tasks.");
});

///////////////////////////////////////////////////////////////////////////////
// TASKS
///////////////////////////////////////////////////////////////////////////////

Task("clean")
    .Description("Clean")
    .Does(() =>
    {
       var deleteSetting = new DeleteDirectorySettings()
       {
          Force = true,
          Recursive = true
       };
      if (DirectoryExists(artifacts))
      {
         DeleteDirectory(artifacts, deleteSetting);
      }
      var binDirs = new string[]
      {
         "./WeihanLi.Templates.Library/content/src/TLibraryName/bin",
         "./WeihanLi.Templates.Library/content/src/TLibraryName/obj",
         "./WeihanLi.Templates.Library/content/test/TLibraryName.UnitTest/bin",
         "./WeihanLi.Templates.Library/content/test/TLibraryName.UnitTest/obj",
      };
      foreach (var dir in binDirs)
      {
         if (DirectoryExists(dir))
         {
            DeleteDirectory(dir, deleteSetting);
         }        
      }      
    });

Task("pack")
    .Description("Pack package")
    .IsDependentOn("clean")
    .Does(() =>
    {      
      
      var nuGetPackSettings = new NuGetPackSettings
      {
         OutputDirectory = artifacts,
         Properties = new Dictionary<string, string>()
         {
            { "Configuration", configuration }
         }
      };
      if(configuration == "Debug"){
         nuGetPackSettings.Suffix = $"preview-{DateTime.UtcNow:yyyyMMdd-HHmmss}";
      }
      NuGetPack(nuspecFiles, nuGetPackSettings);
    });

Task("Default")
    .IsDependentOn("pack");

RunTarget(target);