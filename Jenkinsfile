#!groovy

@Library('cib-pipeline-library@master') _

import de.cib.pipeline.library.Constants
import de.cib.pipeline.library.ConstantsInternal

standardNPMPipeline(
    primaryBranch: 'main',

    // Auto enable unit test and SAST
    uiParamPresets: [
        'UNIT_TESTS': true,
        'SAST': true
    ],

    // Test configuration - the preset writes its own reports to the paths it standardises
    testResultsPattern: ConstantsInternal.MAVEN_TEST_RESULTS,
    coverageCoberturaPattern: 'target/coverage/cobertura-coverage.xml',
    coverageLcovPattern: 'target/coverage/lcov.info',

    // npm pack output of the build script
    buildArtifacts: 'dist/*.tgz',

    // Publish configuration
    npmAllowRepublish: false,
    npmCredentialsId: Constants.CIBSEVEN_NPM_CREDENTIALS_ID,
    npmDevRegistry: Constants.CIBSEVEN_NPM_REGISTRY_DEV_URL,
    npmReleaseRegistry: Constants.CIBSEVEN_NPM_REGISTRY_RELEASE_URL
)
